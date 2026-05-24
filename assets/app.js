(() => {
  const rows = window.CFDCI_DATA || [];
  const meta = window.CFDCI_META || {};
  const domains = meta.domains || [];
  const metricOptions = [{ key: "score", label: "数字化能力" }, ...domains];
  const sectorOrder = ["银行", "保险", "证券"];
  const palette = ["#0f7b78", "#b45b32", "#2f6f98", "#6f4ca2", "#3d8c72", "#9a3733"];

  const state = {
    year: meta.latestYear,
    sector: "all",
    type: "all",
    province: "all",
    metric: "score",
    institution: "",
  };

  const charts = {};
  const $ = (selector) => document.querySelector(selector);

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!rows.length) {
      document.body.classList.add("data-empty");
      return;
    }

    hydrateHero();
    buildControls();
    initCharts();
    bindControls();
    renderAll();
    window.addEventListener("resize", resizeCharts);
    if (window.lucide) window.lucide.createIcons();
  }

  function hydrateHero() {
    $("#heroMean").textContent = formatScore(meta.latestMean);
    $("#heroDelta").textContent = `较 ${meta.previousYear} 年 ${formatDelta(meta.latestYoY)}`;
    $("#institutionCount").textContent = formatInteger(meta.institutionCount);
    $("#rowCount").textContent = formatInteger(meta.rowCount);
    $("#geoCount").textContent = formatInteger(meta.provinceCount);
  }

  function buildControls() {
    const metricButtons = $("#metricButtons");
    metricButtons.innerHTML = metricOptions
      .map(
        (metric) => `
          <button class="segment-button ${metric.key === state.metric ? "is-active" : ""}" type="button" data-metric="${metric.key}">
            ${escapeHtml(metric.label)}
          </button>
        `,
      )
      .join("");

    const years = [...(meta.years || [])].sort((a, b) => b - a);
    $("#yearSelect").innerHTML = years
      .map((year) => `<option value="${year}" ${year === state.year ? "selected" : ""}>${year}</option>`)
      .join("");

    const sectors = unique(rows.map((row) => row.sector)).sort(sortSectors);
    $("#sectorSelect").innerHTML = [
      `<option value="all">全部大类</option>`,
      ...sectors.map((sector) => `<option value="${escapeAttr(sector)}">${escapeHtml(sector)}</option>`),
    ].join("");

    buildTypeOptions();

    const provinces = unique(rows.map((row) => row.province)).sort((a, b) => a.localeCompare(b, "zh-CN"));
    $("#provinceSelect").innerHTML = [
      `<option value="all">全部地区</option>`,
      ...provinces.map((province) => `<option value="${escapeAttr(province)}">${escapeHtml(province)}</option>`),
    ].join("");

    const institutions = unique(rows.map((row) => row.institution)).sort((a, b) => a.localeCompare(b, "zh-CN"));
    $("#institutionList").innerHTML = institutions
      .map((institution) => `<option value="${escapeAttr(institution)}"></option>`)
      .join("");
  }

  function buildTypeOptions() {
    const typeRows = state.sector === "all" ? rows : rows.filter((row) => row.sector === state.sector);
    const types = unique(typeRows.map((row) => row.type)).sort((a, b) => a.localeCompare(b, "zh-CN"));
    const typeSelect = $("#typeSelect");
    const previous = state.type;

    typeSelect.innerHTML = [
      `<option value="all">全部类型</option>`,
      ...types.map((type) => `<option value="${escapeAttr(type)}">${escapeHtml(type)}</option>`),
    ].join("");

    if (previous !== "all" && types.includes(previous)) {
      state.type = previous;
      typeSelect.value = previous;
    } else {
      state.type = "all";
      typeSelect.value = "all";
    }
  }

  function bindControls() {
    $("#metricButtons").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-metric]");
      if (!button) return;
      state.metric = button.dataset.metric;
      document.querySelectorAll(".segment-button").forEach((item) => {
        item.classList.toggle("is-active", item.dataset.metric === state.metric);
      });
      renderAll();
    });

    $("#yearSelect").addEventListener("change", (event) => {
      state.year = Number(event.target.value);
      renderAll();
    });

    $("#sectorSelect").addEventListener("change", (event) => {
      state.sector = event.target.value;
      buildTypeOptions();
      renderAll();
    });

    $("#typeSelect").addEventListener("change", (event) => {
      state.type = event.target.value;
      renderAll();
    });

    $("#provinceSelect").addEventListener("change", (event) => {
      state.province = event.target.value;
      renderAll();
    });

    $("#institutionSearch").addEventListener("input", (event) => {
      state.institution = event.target.value.trim();
      renderAll();
    });
  }

  function initCharts() {
    if (!window.echarts) {
      document.querySelectorAll(".chart").forEach((chart) => {
        chart.textContent = "图表库加载失败";
      });
      return;
    }

    charts.trend = window.echarts.init($("#trendChart"));
    charts.domain = window.echarts.init($("#domainChart"));
    charts.distribution = window.echarts.init($("#distributionChart"));
    charts.region = window.echarts.init($("#regionChart"));
  }

  function renderAll() {
    renderSignalBoard();
    renderSnapshot();
    renderTrendChart();
    renderDomainChart();
    renderDistributionChart();
    renderRegionChart();
    renderRanking();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderSignalBoard() {
    const latestRows = rows
      .filter((row) => row.year === meta.latestYear && isNumber(row.score))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    $("#signalBoard").innerHTML = latestRows
      .map(
        (row, index) => `
          <article class="signal-card" style="--accent:${palette[index % palette.length]}">
            <span class="rank-badge">${index + 1}</span>
            <h3>${escapeHtml(row.institution)}</h3>
            <p>${escapeHtml(row.sector)} · ${escapeHtml(row.type)}</p>
            <strong>${formatScore(row.score)}</strong>
            <span>${escapeHtml(row.province)} ${escapeHtml(row.city)}</span>
          </article>
        `,
      )
      .join("");
  }

  function renderSnapshot() {
    const filtered = getFilteredRows({ includeYear: true, includeInstitution: true });
    const metricLabel = getMetricLabel(state.metric);
    const mean = average(filtered, state.metric);
    const top = topBy(filtered, state.metric);
    const domainStats = domains
      .map((domain) => ({ ...domain, value: average(filtered, domain.key) }))
      .filter((item) => isNumber(item.value))
      .sort((a, b) => b.value - a.value);

    $("#filteredMean").textContent = formatScore(mean);
    $("#filteredCount").textContent = `${formatInteger(filtered.length)} 条记录 · ${metricLabel}`;

    $("#topInstitution").textContent = top ? top.institution : "无数据";
    $("#topInstitutionScore").textContent = top ? `${metricLabel} ${formatScore(top[state.metric])}` : "-";

    $("#topDomain").textContent = domainStats[0] ? domainStats[0].label : "无数据";
    $("#topDomainScore").textContent = domainStats[0] ? formatScore(domainStats[0].value) : "-";
  }

  function renderTrendChart() {
    if (!charts.trend) return;
    const years = meta.years || [];
    const base = getFilteredRows({ includeYear: false, includeInstitution: true });
    const metricLabel = getMetricLabel(state.metric);
    let series = [];

    if (state.institution) {
      const institutionNames = unique(base.map((row) => row.institution)).slice(0, 4);
      series = institutionNames.map((name, index) => ({
        name,
        type: "line",
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 3 },
        itemStyle: { color: palette[index % palette.length] },
        data: years.map((year) => average(base.filter((row) => row.year === year && row.institution === name), state.metric)),
      }));
      $("#trendCaption").textContent = "匹配机构年度序列";
    } else if (state.sector === "all" && state.type === "all") {
      const sectors = unique(base.map((row) => row.sector)).sort(sortSectors);
      series = sectors.map((sector, index) => ({
        name: sector,
        type: "line",
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 3 },
        itemStyle: { color: palette[index % palette.length] },
        data: years.map((year) => average(base.filter((row) => row.year === year && row.sector === sector), state.metric)),
      }));
      $("#trendCaption").textContent = "按机构大类展示均值";
    } else if (state.type === "all") {
      const groups = topGroups(base, "type", 5);
      series = groups.map((type, index) => ({
        name: type,
        type: "line",
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 3 },
        itemStyle: { color: palette[index % palette.length] },
        data: years.map((year) => average(base.filter((row) => row.year === year && row.type === type), state.metric)),
      }));
      $("#trendCaption").textContent = "按机构类型展示均值";
    } else {
      series = [
        {
          name: "当前筛选",
          type: "line",
          smooth: true,
          symbolSize: 7,
          lineStyle: { width: 3 },
          itemStyle: { color: palette[0] },
          data: years.map((year) => average(base.filter((row) => row.year === year), state.metric)),
        },
      ];
      $("#trendCaption").textContent = "当前筛选年度均值";
    }

    charts.trend.setOption({
      color: palette,
      grid: { top: 54, right: 24, bottom: 36, left: 44 },
      tooltip: { trigger: "axis", valueFormatter: (value) => formatScore(value) },
      legend: { top: 8, left: 8, textStyle: { color: "#53615f" } },
      xAxis: {
        type: "category",
        data: years,
        axisLine: { lineStyle: { color: "#cfc9be" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 1,
        splitLine: { lineStyle: { color: "#e5ded1" } },
        axisLabel: { formatter: (value) => value.toFixed(1) },
      },
      series,
      aria: { enabled: true, description: `${metricLabel}年度趋势` },
    });
  }

  function renderDomainChart() {
    if (!charts.domain) return;
    const filtered = getFilteredRows({ includeYear: true, includeInstitution: true });
    const values = domains.map((domain) => average(filtered, domain.key) || 0);

    charts.domain.setOption({
      color: ["#0f7b78"],
      tooltip: { valueFormatter: (value) => formatScore(value) },
      radar: {
        radius: "68%",
        center: ["50%", "54%"],
        indicator: domains.map((domain) => ({ name: domain.label, max: 1 })),
        splitLine: { lineStyle: { color: "#e5ded1" } },
        splitArea: { areaStyle: { color: ["#faf7ef", "#f2eee4"] } },
        axisName: { color: "#53615f", fontSize: 11 },
      },
      series: [
        {
          type: "radar",
          data: [{ value: values, name: "能力域均值" }],
          areaStyle: { opacity: 0.18 },
          lineStyle: { width: 3 },
          symbolSize: 5,
        },
      ],
    });
  }

  function renderDistributionChart() {
    if (!charts.distribution) return;
    const filtered = getFilteredRows({ includeYear: true, includeInstitution: true }).filter((row) => isNumber(row[state.metric]));
    const bins = Array.from({ length: 10 }, (_, index) => ({
      label: `${(index / 10).toFixed(1)}-${((index + 1) / 10).toFixed(1)}`,
      count: 0,
    }));

    filtered.forEach((row) => {
      const value = Math.max(0, Math.min(0.999999, row[state.metric]));
      bins[Math.floor(value * 10)].count += 1;
    });

    charts.distribution.setOption({
      color: ["#b45b32"],
      grid: { top: 16, right: 18, bottom: 42, left: 42 },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: bins.map((bin) => bin.label),
        axisLabel: { rotate: 35 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#cfc9be" } },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#e5ded1" } },
      },
      series: [{ type: "bar", data: bins.map((bin) => bin.count), barWidth: "64%" }],
    });
  }

  function renderRegionChart() {
    if (!charts.region) return;
    const filtered = getFilteredRows({ includeYear: true, includeInstitution: true });
    const field = state.province === "all" ? "province" : "city";
    const grouped = groupAverage(filtered, field, state.metric).slice(0, 12);

    $("#regionTitle").textContent = state.province === "all" ? "地区排名" : "城市排名";
    $("#regionCaption").textContent = state.province === "all" ? "省级均值前列" : `${state.province} 城市均值前列`;

    charts.region.setOption({
      color: ["#2f6f98"],
      grid: { top: 16, right: 28, bottom: 22, left: 110 },
      tooltip: { trigger: "axis", valueFormatter: (value) => formatScore(value) },
      xAxis: {
        type: "value",
        min: 0,
        max: 1,
        splitLine: { lineStyle: { color: "#e5ded1" } },
        axisLabel: { formatter: (value) => value.toFixed(1) },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: grouped.map((item) => item.name),
        axisTick: { show: false },
        axisLine: { show: false },
      },
      series: [
        {
          type: "bar",
          data: grouped.map((item) => item.value),
          barWidth: 14,
          label: { show: true, position: "right", formatter: ({ value }) => formatScore(value) },
        },
      ],
    });
  }

  function renderRanking() {
    const filtered = getFilteredRows({ includeYear: true, includeInstitution: true })
      .filter((row) => isNumber(row[state.metric]))
      .sort((a, b) => b[state.metric] - a[state.metric])
      .slice(0, 15);
    const metricLabel = getMetricLabel(state.metric);

    $("#rankMetricLabel").textContent = metricLabel;
    $("#rankingBody").innerHTML = filtered.length
      ? filtered
          .map(
            (row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(row.institution)}</td>
                <td>${escapeHtml(row.sector)}</td>
                <td>${escapeHtml(row.type)}</td>
                <td>${escapeHtml(row.province)} · ${escapeHtml(row.city)}</td>
                <td>${formatScore(row[state.metric])}</td>
              </tr>
            `,
          )
          .join("")
      : `<tr><td colspan="6">当前筛选无数据</td></tr>`;
  }

  function getFilteredRows({ includeYear, includeInstitution }) {
    const query = state.institution.trim();
    return rows.filter((row) => {
      if (includeYear && row.year !== state.year) return false;
      if (state.sector !== "all" && row.sector !== state.sector) return false;
      if (state.type !== "all" && row.type !== state.type) return false;
      if (state.province !== "all" && row.province !== state.province) return false;
      if (includeInstitution && query && !row.institution.includes(query)) return false;
      return isNumber(row[state.metric]);
    });
  }

  function groupAverage(sourceRows, field, metric) {
    const grouped = new Map();
    sourceRows.forEach((row) => {
      if (!isNumber(row[metric])) return;
      const key = row[field] || "未披露";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row[metric]);
    });

    return [...grouped.entries()]
      .map(([name, values]) => ({ name, value: values.reduce((sum, value) => sum + value, 0) / values.length }))
      .sort((a, b) => b.value - a.value);
  }

  function topGroups(sourceRows, field, limit) {
    const counts = new Map();
    sourceRows.forEach((row) => counts.set(row[field], (counts.get(row[field]) || 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name]) => name);
  }

  function topBy(sourceRows, metric) {
    return sourceRows
      .filter((row) => isNumber(row[metric]))
      .reduce((best, row) => (!best || row[metric] > best[metric] ? row : best), null);
  }

  function average(sourceRows, metric) {
    const values = sourceRows.map((row) => row[metric]).filter(isNumber);
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function getMetricLabel(metricKey) {
    return metricOptions.find((metric) => metric.key === metricKey)?.label || metricKey;
  }

  function sortSectors(a, b) {
    const aIndex = sectorOrder.indexOf(a);
    const bIndex = sectorOrder.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    return a.localeCompare(b, "zh-CN");
  }

  function isNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function formatScore(value) {
    if (!isNumber(value)) return "-";
    return value.toFixed(3);
  }

  function formatDelta(value) {
    if (!isNumber(value)) return "-";
    return `${value >= 0 ? "+" : ""}${value.toFixed(3)}`;
  }

  function formatInteger(value) {
    return Number(value || 0).toLocaleString("zh-CN");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }

  function resizeCharts() {
    Object.values(charts).forEach((chart) => chart?.resize());
  }
})();
