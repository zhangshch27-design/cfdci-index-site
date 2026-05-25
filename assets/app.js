(() => {
  const rows = window.CFDCI_DATA || [];
  const meta = window.CFDCI_META || {};
  const domains = meta.domains || [];
  const translations = window.CFDCI_TRANSLATIONS || {};
  const i18n = {
    en: {
      title: "China Financial Institutions Digital Capability Index",
      description:
        "China Financial Institutions Digital Capability Index, built from annual reports and CSR reports of banks, insurers, and securities firms. The site presents sample construction, the indicator system, scoring procedures, quality checks, and external validation.",
      metricScore: "Digital capability",
      allSectors: "All sectors",
      allTypes: "All types",
      allRegions: "All regions",
      searchPlaceholder: "Search institution",
      chartLibFail: "Chart library failed to load",
      records: "records",
      noData: "No data",
      filteredCount: (count, metric) => `${formatInteger(count)} records · ${metric}`,
      heroDelta: (year) => `Latest public year: ${year}`,
      topScore: (metric, score) => `${metric} ${score}`,
      trendInstitution: "Matched institution series",
      trendSector: "Means by sector",
      trendType: "Means by institution type",
      trendCurrent: "Mean for current filter",
      currentFilter: "Current filter",
      domainMean: "Domain mean",
      regionTitleProvince: "Regional ranking",
      regionTitleCity: "City ranking",
      regionCaptionProvince: "Mean of the top five banks by province",
      regionCaptionCity: (province) => `Mean of the top five banks by city in ${province}`,
      rank: "Rank",
      institution: "Institution",
      sector: "Sector",
      type: "Type",
      region: "Region",
      unknownLocation: "Undisclosed location",
      emptyRanking: "No data under the current filters",
      sectors: {
        银行: "Banks",
        保险: "Insurers",
        证券: "Securities firms",
      },
      types: {
        人身险: "Life insurance",
        保险资产管理: "Insurance asset management",
        保险集团: "Insurance group",
        再保险: "Reinsurance",
        农村商业银行: "Rural commercial bank",
        国有商业银行: "State-owned commercial bank",
        城市商业银行: "City commercial bank",
        外资银行: "Foreign bank",
        民营银行: "Private bank",
        股份制商业银行: "Joint-stock commercial bank",
        证券公司: "Securities company",
        财产险: "Property and casualty insurance",
      },
      provinces: {
        上海市: "Shanghai",
        云南省: "Yunnan",
        内蒙古自治区: "Inner Mongolia",
        北京市: "Beijing",
        吉林省: "Jilin",
        四川省: "Sichuan",
        天津市: "Tianjin",
        宁夏回族自治区: "Ningxia",
        安徽省: "Anhui",
        山东省: "Shandong",
        山西省: "Shanxi",
        广东省: "Guangdong",
        广西壮族自治区: "Guangxi",
        新疆维吾尔自治区: "Xinjiang",
        江苏省: "Jiangsu",
        江西省: "Jiangxi",
        河北省: "Hebei",
        河南省: "Henan",
        浙江省: "Zhejiang",
        海南省: "Hainan",
        湖北省: "Hubei",
        湖南省: "Hunan",
        甘肃省: "Gansu",
        福建省: "Fujian",
        西藏自治区: "Tibet",
        贵州省: "Guizhou",
        辽宁省: "Liaoning",
        重庆市: "Chongqing",
        陕西省: "Shaanxi",
        青海省: "Qinghai",
        香港: "Hong Kong",
        黑龙江省: "Heilongjiang",
      },
      domains: {
        governance: "Fintech Governance System",
        dataPotential: "Data Factor Potential",
        infrastructure: "New Digital Infrastructure",
        coreTechnology: "Core Technology Application",
        operationMomentum: "Digital Operating Momentum",
        serviceReengineering: "Financial Service Reengineering",
        riskManagement: "Prudent Fintech Management",
        sustainability: "Sustainable Development Foundation",
      },
    },
    zh: {
      title: "中国金融机构数字化能力指数",
      description:
        "中国金融机构数字化能力指数，覆盖银行、保险与证券机构，基于公开年报和社会责任报告构建，展示样本构建、指标体系、评分程序、质量检验和外部效标结果。",
      metricScore: "数字化能力",
      allSectors: "全部大类",
      allTypes: "全部类型",
      allRegions: "全部地区",
      searchPlaceholder: "输入机构名称",
      chartLibFail: "图表库加载失败",
      records: "条记录",
      noData: "无数据",
      filteredCount: (count, metric) => `${formatInteger(count)} 条记录 · ${metric}`,
      heroDelta: (year) => `最新公开年份：${year}`,
      topScore: (metric, score) => `${metric} ${score}`,
      trendInstitution: "匹配机构年度序列",
      trendSector: "按机构大类展示均值",
      trendType: "按机构类型展示均值",
      trendCurrent: "当前筛选年度均值",
      currentFilter: "当前筛选",
      domainMean: "能力域均值",
      regionTitleProvince: "地区排名",
      regionTitleCity: "城市排名",
      regionCaptionProvince: "各省前五家银行均值",
      regionCaptionCity: (province) => `${province} 各城市前五家银行均值`,
      rank: "排名",
      institution: "机构",
      sector: "大类",
      type: "类型",
      region: "地区",
      unknownLocation: "未披露地区",
      emptyRanking: "当前筛选无数据",
      sectors: {},
      types: {},
      provinces: {},
      domains: {},
    },
  };
  const sectorOrder = ["银行", "保险", "证券"];
  const regionRankingSector = "银行";
  const palette = ["#0f7b78", "#b45b32", "#2f6f98", "#6f4ca2", "#3d8c72", "#9a3733"];
  let currentLang = normalizeLanguage(localStorage.getItem("cfdci-language") || document.documentElement.dataset.lang || "en");
  let initialized = false;

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
    setupLanguage();

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
    initialized = true;
  }

  function setupLanguage() {
    applyLanguage(currentLang, { rerender: false });
    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      button.addEventListener("click", () => {
        applyLanguage(button.dataset.langSwitch);
      });
    });
  }

  function applyLanguage(lang, { rerender = true } = {}) {
    currentLang = normalizeLanguage(lang);
    localStorage.setItem("cfdci-language", currentLang);
    document.documentElement.dataset.lang = currentLang;
    document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
    document.title = t("title");
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", t("description"));
    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.langSwitch === currentLang);
    });
    const search = $("#institutionSearch");
    if (search) search.placeholder = t("searchPlaceholder");

    if (rerender && initialized) {
      hydrateHero();
      buildControls();
      renderAll();
      resizeCharts();
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function hydrateHero() {
    $("#heroMean").textContent = formatScore(meta.latestMean);
    $("#heroDelta").textContent = t("heroDelta", meta.latestYear);
    $("#institutionCount").textContent = formatInteger(meta.institutionCount);
    $("#rowCount").textContent = formatInteger(meta.rowCount);
    $("#geoCount").textContent = formatInteger(meta.provinceCount);
  }

  function buildControls() {
    const metricOptions = getMetricOptions();
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
      `<option value="all">${escapeHtml(t("allSectors"))}</option>`,
      ...sectors.map((sector) => `<option value="${escapeAttr(sector)}">${escapeHtml(formatSector(sector))}</option>`),
    ].join("");

    buildTypeOptions();

    const provinces = unique(rows.map((row) => row.province)).sort((a, b) => a.localeCompare(b, "zh-CN"));
    $("#provinceSelect").innerHTML = [
      `<option value="all">${escapeHtml(t("allRegions"))}</option>`,
      ...provinces.map((province) => `<option value="${escapeAttr(province)}">${escapeHtml(formatProvince(province))}</option>`),
    ].join("");

    const institutions = unique(rows.map((row) => row.institution)).sort((a, b) => a.localeCompare(b, "zh-CN"));
    $("#institutionList").innerHTML = institutions
      .map((institution) => `<option value="${escapeAttr(formatInstitution(institution))}"></option>`)
      .join("");
  }

  function buildTypeOptions() {
    const typeRows = state.sector === "all" ? rows : rows.filter((row) => row.sector === state.sector);
    const types = unique(typeRows.map((row) => row.type)).sort((a, b) => a.localeCompare(b, "zh-CN"));
    const typeSelect = $("#typeSelect");
    const previous = state.type;

    typeSelect.innerHTML = [
      `<option value="all">${escapeHtml(t("allTypes"))}</option>`,
      ...types.map((type) => `<option value="${escapeAttr(type)}">${escapeHtml(formatType(type))}</option>`),
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
        chart.textContent = t("chartLibFail");
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
            <h3>${escapeHtml(formatInstitution(row.institution))}</h3>
            <p>${escapeHtml(formatSector(row.sector))} · ${escapeHtml(formatType(row.type))}</p>
            <strong>${formatScore(row.score)}</strong>
            <span>${escapeHtml(formatRegion(row))}</span>
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
      .map((domain) => ({ ...domain, label: getDomainLabel(domain), value: average(filtered, domain.key) }))
      .filter((item) => isNumber(item.value))
      .sort((a, b) => b.value - a.value);

    $("#filteredMean").textContent = formatScore(mean);
    $("#filteredCount").textContent = t("filteredCount", filtered.length, metricLabel);

    $("#topInstitution").textContent = top ? formatInstitution(top.institution) : t("noData");
    $("#topInstitutionScore").textContent = top ? t("topScore", metricLabel, formatScore(top[state.metric])) : "-";

    $("#topDomain").textContent = domainStats[0] ? domainStats[0].label : t("noData");
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
        name: formatInstitution(name),
        type: "line",
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 3 },
        itemStyle: { color: palette[index % palette.length] },
        data: years.map((year) => average(base.filter((row) => row.year === year && row.institution === name), state.metric)),
      }));
      $("#trendCaption").textContent = t("trendInstitution");
    } else if (state.sector === "all" && state.type === "all") {
      const sectors = unique(base.map((row) => row.sector)).sort(sortSectors);
      series = sectors.map((sector, index) => ({
        name: formatSector(sector),
        type: "line",
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 3 },
        itemStyle: { color: palette[index % palette.length] },
        data: years.map((year) => average(base.filter((row) => row.year === year && row.sector === sector), state.metric)),
      }));
      $("#trendCaption").textContent = t("trendSector");
    } else if (state.type === "all") {
      const groups = topGroups(base, "type", 5);
      series = groups.map((type, index) => ({
        name: formatType(type),
        type: "line",
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 3 },
        itemStyle: { color: palette[index % palette.length] },
        data: years.map((year) => average(base.filter((row) => row.year === year && row.type === type), state.metric)),
      }));
      $("#trendCaption").textContent = t("trendType");
    } else {
      series = [
        {
          name: t("currentFilter"),
          type: "line",
          smooth: true,
          symbolSize: 7,
          lineStyle: { width: 3 },
          itemStyle: { color: palette[0] },
          data: years.map((year) => average(base.filter((row) => row.year === year), state.metric)),
        },
      ];
      $("#trendCaption").textContent = t("trendCurrent");
    }

    const trendAxisMax = getTrendAxisMax(series);

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
        max: trendAxisMax,
        splitLine: { lineStyle: { color: "#e5ded1" } },
        axisLabel: { formatter: (value) => value.toFixed(1) },
      },
      series,
      aria: { enabled: true, description: `${metricLabel} annual trend` },
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
        indicator: domains.map((domain) => ({ name: getDomainLabel(domain), max: 1 })),
        splitLine: { lineStyle: { color: "#e5ded1" } },
        splitArea: { areaStyle: { color: ["#faf7ef", "#f2eee4"] } },
        axisName: { color: "#53615f", fontSize: 11 },
      },
      series: [
        {
          type: "radar",
          data: [{ value: values, name: t("domainMean") }],
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
    const filtered = getRegionRankingRows();
    const field = state.province === "all" ? "province" : "city";
    const grouped = groupTopAverage(filtered, field, state.metric, 5).slice(0, 12);

    $("#regionTitle").textContent = state.province === "all" ? t("regionTitleProvince") : t("regionTitleCity");
    $("#regionCaption").textContent =
      state.province === "all" ? t("regionCaptionProvince") : t("regionCaptionCity", formatProvince(state.province));

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
        data: grouped.map((item) => (field === "province" ? formatProvince(item.name) : formatCity(item.name))),
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

    $("#rankHeaderRank").textContent = t("rank");
    $("#rankHeaderInstitution").textContent = t("institution");
    $("#rankHeaderSector").textContent = t("sector");
    $("#rankHeaderType").textContent = t("type");
    $("#rankHeaderRegion").textContent = t("region");
    $("#rankMetricLabel").textContent = metricLabel;
    $("#rankingBody").innerHTML = filtered.length
      ? filtered
          .map(
            (row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(formatInstitution(row.institution))}</td>
                <td>${escapeHtml(formatSector(row.sector))}</td>
                <td>${escapeHtml(formatType(row.type))}</td>
                <td>${escapeHtml(formatRegion(row))}</td>
                <td>${formatScore(row[state.metric])}</td>
              </tr>
            `,
          )
          .join("")
      : `<tr><td colspan="6">${escapeHtml(t("emptyRanking"))}</td></tr>`;
  }

  function getFilteredRows({ includeYear, includeInstitution }) {
    const query = state.institution.trim();
    return rows.filter((row) => {
      if (includeYear && row.year !== state.year) return false;
      if (state.sector !== "all" && row.sector !== state.sector) return false;
      if (state.type !== "all" && row.type !== state.type) return false;
      if (state.province !== "all" && row.province !== state.province) return false;
      if (includeInstitution && query && !matchesInstitution(row.institution, query)) return false;
      return isNumber(row[state.metric]);
    });
  }

  function getRegionRankingRows() {
    const query = state.institution.trim();
    return rows.filter((row) => {
      if (row.year !== state.year) return false;
      if (row.sector !== regionRankingSector) return false;
      if (state.province !== "all" && row.province !== state.province) return false;
      if (query && !matchesInstitution(row.institution, query)) return false;
      return isNumber(row[state.metric]);
    });
  }

  function groupAverage(sourceRows, field, metric) {
    const grouped = new Map();
    sourceRows.forEach((row) => {
      if (!isNumber(row[metric])) return;
      const key = row[field] || "__unknown__";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row[metric]);
    });

    return [...grouped.entries()]
      .map(([name, values]) => ({ name, value: values.reduce((sum, value) => sum + value, 0) / values.length }))
      .sort((a, b) => b.value - a.value);
  }

  function groupTopAverage(sourceRows, field, metric, limit) {
    const grouped = new Map();
    sourceRows.forEach((row) => {
      if (!isNumber(row[metric])) return;
      const key = row[field] || "__unknown__";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row[metric]);
    });

    return [...grouped.entries()]
      .map(([name, values]) => {
        const topValues = values.sort((a, b) => b - a).slice(0, limit);
        return { name, value: topValues.reduce((sum, value) => sum + value, 0) / topValues.length };
      })
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

  function getTrendAxisMax(series) {
    const values = series.flatMap((item) => item.data || []).filter(isNumber);
    if (!values.length) return 1;
    const padded = Math.max(0.1, Math.max(...values) * 1.08);
    const step = padded <= 0.2 ? 0.02 : padded <= 0.8 ? 0.05 : 0.1;
    return Math.min(1, Number((Math.ceil(padded / step) * step).toFixed(2)));
  }

  function average(sourceRows, metric) {
    const values = sourceRows.map((row) => row[metric]).filter(isNumber);
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function getMetricOptions() {
    return [{ key: "score", label: t("metricScore") }, ...domains.map((domain) => ({ ...domain, label: getDomainLabel(domain) }))];
  }

  function getMetricLabel(metricKey) {
    return getMetricOptions().find((metric) => metric.key === metricKey)?.label || metricKey;
  }

  function getDomainLabel(domain) {
    return i18n[currentLang].domains[domain.key] || domain.label;
  }

  function formatSector(value) {
    return i18n[currentLang].sectors[value] || value;
  }

  function formatType(value) {
    return i18n[currentLang].types[value] || value;
  }

  function formatProvince(value) {
    return i18n[currentLang].provinces[value] || value;
  }

  function formatInstitution(value) {
    if (currentLang === "en") return translations.institutions?.[value] || fallbackEnglishLabel(value, "Institution");
    return value || t("noData");
  }

  function formatCity(value) {
    if (!value || value === "__unknown__") return t("unknownLocation");
    if (currentLang === "en") return translations.cities?.[value] || fallbackEnglishLabel(value, "Location");
    return value;
  }

  function formatRegion(row) {
    const province = formatProvince(row.province);
    const city = formatCity(row.city);
    if (!city || province === city) return province;
    return `${province} · ${city}`;
  }

  function matchesInstitution(value, query) {
    const raw = String(value || "").toLocaleLowerCase();
    const display = formatInstitution(value).toLocaleLowerCase();
    const normalizedQuery = String(query || "").toLocaleLowerCase();
    return raw.includes(normalizedQuery) || display.includes(normalizedQuery);
  }

  function fallbackEnglishLabel(value, prefix) {
    const code = String(value || "")
      .split("")
      .map((char) => char.charCodeAt(0).toString(10))
      .join("-");
    return code ? `${prefix} ${code}` : prefix;
  }

  function t(key, ...args) {
    const value = i18n[currentLang][key];
    if (typeof value === "function") return value(...args);
    return value ?? key;
  }

  function normalizeLanguage(value) {
    return value === "zh" ? "zh" : "en";
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
    return Number(value || 0).toLocaleString(currentLang === "zh" ? "zh-CN" : "en-US");
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
