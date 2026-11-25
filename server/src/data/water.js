export const waterContent = {
  module: 'water',
  title: 'Water pollution awareness',
  subtitle: 'Freshwater is a shared, finite resource — understanding contamination is the first step to protecting it.',
  updated: '2026-11-01',
  liveData: false,
  dataStatus:
    'No verified public real-time water-quality feed is connected. This module is educational and uses clearly labelled sample demonstrations only.',
  facts: [
    {
      value: '~2.5%',
      label: 'of Earth’s water is freshwater',
      detail: 'Most of it is locked in glaciers and ice caps; less than 1% is easily accessible surface and groundwater.',
      source: 'UN-Water',
    },
    {
      value: '~80%',
      label: 'of wastewater is released without treatment',
      detail: 'A widely cited global estimate. The share varies greatly between countries and cities.',
      source: 'UNESCO WWAP estimate',
    },
    {
      value: '≥ 4 mg/L',
      label: 'dissolved oxygen needed by most fish',
      detail: 'Below this level, aquatic animals become stressed; below ~2 mg/L, fish kills become likely.',
      source: 'CPCB water-quality criteria (indicative)',
    },
    {
      value: '1 in 3',
      label: 'people lack safely managed sanitation',
      detail: 'Unsafe water, sanitation and hygiene remain major causes of preventable disease, especially in children.',
      source: 'WHO / UNICEF JMP (indicative)',
    },
  ],
  causes: [
    {
      title: 'Untreated sewage',
      icon: 'droplets',
      detail:
        'Domestic wastewater carries organic matter, nutrients, pathogens and pharmaceuticals. When sewage bypasses treatment plants, rivers receive a continuous oxygen demand.',
    },
    {
      title: 'Industrial effluent',
      icon: 'factory',
      detail:
        'Dyes, heavy metals, acids, solvents and micro-pollutants from textile, chemical, pharmaceutical and metal industries can be toxic even at low concentrations.',
    },
    {
      title: 'Agricultural runoff',
      icon: 'sprout',
      detail:
        'Fertilisers add nitrogen and phosphorus, triggering algal blooms. Pesticides and animal waste add toxic compounds and pathogens.',
    },
    {
      title: 'Plastic and solid waste',
      icon: 'trash',
      detail:
        'Plastic breaks into microplastics that enter food chains. Dumped waste leaches chemicals and blocks waterways, increasing flood risk.',
    },
    {
      title: 'Landfill leachate',
      icon: 'layers',
      detail:
        'Rainwater percolating through waste picks up dissolved salts, metals and organic matter, contaminating groundwater for decades.',
    },
    {
      title: 'Cultural and religious waste',
      icon: 'flower',
      detail:
        'Idol immersion, floral offerings, ashes and non-biodegradable decorations add dyes, plaster, metals and plastic to water bodies.',
    },
    {
      title: 'Oil and chemical spills',
      icon: 'alert',
      detail:
        'Spills from vehicles, workshops and pipelines create surface films that reduce oxygen exchange and poison aquatic life.',
    },
    {
      title: 'Thermal pollution',
      icon: 'thermometer',
      detail:
        'Power plants and industries discharge heated water, lowering dissolved oxygen and stressing temperature-sensitive species.',
    },
  ],
  effects: {
    aquatic: [
      'Oxygen depletion suffocates fish, insects and other aquatic animals.',
      'Nutrient enrichment causes algal blooms and eutrophication, followed by die-offs.',
      'Heavy metals and pesticides accumulate in fish tissues and move up the food chain.',
      'Microplastics are ingested by plankton, fish and birds, causing injury and starvation.',
      'Silt and turbidity block sunlight needed by aquatic plants.',
    ],
    human: [
      'Waterborne diseases such as cholera, typhoid, hepatitis A and diarrhoea.',
      'Chemical exposure from contaminated groundwater used for drinking.',
      'Loss of livelihood for fishing and farming communities.',
      'Higher water-treatment costs and reduced availability of safe water.',
      'Antimicrobial resistance can spread through wastewater.',
    ],
    ecosystems: [
      'Wetlands and floodplains lose their natural filtering capacity when polluted or built over.',
      'Coral reefs and seagrass beds are damaged by runoff and warming.',
      'Biodiversity falls as sensitive species disappear first.',
      'Groundwater contamination can persist for decades and is hard to reverse.',
    ],
  },
  indicators: [
    {
      key: 'ph',
      label: 'pH',
      unit: '',
      ideal: '6.5 – 8.5',
      goodMin: 6.5,
      goodMax: 8.5,
      why:
        'Measures acidity or alkalinity. Most aquatic life is adapted to a narrow range; extreme pH increases the toxicity of metals and damages fish gills.',
      note: 'CPCB inland surface water and BIS 10500 drinking-water guideline: 6.5–8.5.',
    },
    {
      key: 'do',
      label: 'Dissolved oxygen (DO)',
      unit: 'mg/L',
      ideal: '≥ 5 (higher is better)',
      goodMin: 5,
      higherIsBetter: true,
      why:
        'Oxygen dissolved in water is essential for fish and aerobic decomposition. Low DO is one of the clearest signs of organic pollution.',
      note: 'CPCB: Class A ≥6, Class B ≥5, Class C ≥4 mg/L. Below 2 mg/L, fish kills are likely.',
    },
    {
      key: 'bod',
      label: 'BOD (3-day, 27 °C)',
      unit: 'mg/L',
      ideal: '≤ 3 (lower is better)',
      goodMax: 3,
      higherIsBetter: false,
      why:
        'Biochemical oxygen demand estimates how much oxygen microbes consume while breaking down organic matter. High BOD means high organic pollution.',
      note: 'CPCB Class C limit: ≤3 mg/L. Sewage can push BOD above 100 mg/L.',
    },
    {
      key: 'cod',
      label: 'COD',
      unit: 'mg/L',
      ideal: '≤ 20 (indicative, lower is better)',
      goodMax: 20,
      higherIsBetter: false,
      why:
        'Chemical oxygen demand captures both biodegradable and non-biodegradable oxidisable matter. COD is always higher than BOD in polluted water.',
      note: 'COD has no single CPCB class limit; it is used alongside BOD to characterise industrial effluent.',
    },
    {
      key: 'turbidity',
      label: 'Turbidity',
      unit: 'NTU',
      ideal: '≤ 5 (lower is better)',
      goodMax: 5,
      higherIsBetter: false,
      why:
        'Cloudiness caused by suspended particles. Turbidity shields pathogens from disinfection and reduces light for aquatic plants.',
      note: 'BIS 10500: ≤1 NTU desirable, ≤5 NTU permissible for drinking water.',
    },
    {
      key: 'nitrate',
      label: 'Nitrate',
      unit: 'mg/L',
      ideal: '≤ 45 (lower is better)',
      goodMax: 45,
      higherIsBetter: false,
      why:
        'Comes mainly from fertilisers and sewage. High nitrate in drinking water is linked to blue-baby syndrome in infants.',
      note: 'BIS 10500 drinking-water limit: 45 mg/L as NO₃.',
    },
    {
      key: 'tds',
      label: 'Total dissolved solids',
      unit: 'mg/L',
      ideal: '≤ 500 (lower is better)',
      goodMax: 500,
      higherIsBetter: false,
      why:
        'Dissolved salts and minerals affect taste, hardness and suitability for irrigation. Very high TDS harms crops and aquatic life.',
      note: 'BIS 10500: 500 mg/L desirable, 2000 mg/L permissible.',
    },
    {
      key: 'coliform',
      label: 'Faecal coliform',
      unit: 'MPN/100 mL',
      ideal: '≤ 500 (Class B); 0 for drinking',
      goodMax: 500,
      higherIsBetter: false,
      why:
        'Indicator bacteria that signal sewage contamination. Their presence means disease-causing organisms may also be present.',
      note: 'CPCB Class A ≤50, Class B ≤500 MPN/100 mL. Drinking water must contain none.',
    },
  ],
  samples: {
    label: 'SAMPLE DEMONSTRATION DATA',
    disclaimer:
      'These values are illustrative examples created for this college project. They are NOT measurements from these rivers and must not be cited as real monitoring data. Live water-quality data would need to come from MPCB/CPCB monitoring stations or verified sensors.',
    rivers: [
      {
        name: 'Mula (sample)',
        location: 'Pune city stretch',
        values: { ph: 7.6, do: 4.2, bod: 8.5, cod: 32, turbidity: 18, nitrate: 12, tds: 480, coliform: 900 },
      },
      {
        name: 'Mutha (sample)',
        location: 'Pune city stretch',
        values: { ph: 7.4, do: 3.8, bod: 11.2, cod: 44, turbidity: 24, nitrate: 15, tds: 560, coliform: 1400 },
      },
      {
        name: 'Pavana (sample)',
        location: 'Upstream reservoir influence',
        values: { ph: 7.8, do: 6.1, bod: 3.2, cod: 14, turbidity: 9, nitrate: 7, tds: 310, coliform: 220 },
      },
      {
        name: 'Indrayani (sample)',
        location: 'Rural / temple town stretch',
        values: { ph: 7.5, do: 5.2, bod: 5.8, cod: 22, turbidity: 12, nitrate: 9, tds: 390, coliform: 480 },
      },
    ],
  },
  conservation: [
    { title: 'Fix leaks promptly', detail: 'A dripping tap can waste several litres a day; a leaking toilet can waste far more.', icon: 'wrench' },
    { title: 'Take shorter showers', detail: 'A bucket often uses less water than a long shower. Every minute saved matters.', icon: 'shower' },
    { title: 'Harvest rainwater', detail: 'Rooftop collection and recharge pits reduce runoff and replenish groundwater.', icon: 'cloud-rain' },
    { title: 'Reuse RO reject water', detail: 'Use it for cleaning, flushing or watering non-edible plants instead of pouring it away.', icon: 'recycle' },
    { title: 'Water plants wisely', detail: 'Water early morning or evening, use drip irrigation, and choose native plants.', icon: 'sprout' },
    { title: 'Run full loads', detail: 'Washing machines and dishwashers use the same water for a full or partial load.', icon: 'washing-machine' },
    { title: 'Do not hose driveways', detail: 'A broom and bucket use a fraction of the water of a running hose.', icon: 'brush' },
    { title: 'Protect local water bodies', detail: 'Join or support clean-ups, and never dump waste into drains that lead to rivers.', icon: 'heart-handshake' },
  ],
  prevention: [
    { title: 'Treat sewage before discharge', detail: 'Upgrade and maintain sewage treatment plants; ensure capacity keeps pace with city growth.', icon: 'building' },
    { title: 'Enforce industrial pretreatment', detail: 'Industries must treat effluent to CPCB/MPCB standards before releasing it into drains or rivers.', icon: 'factory' },
    { title: 'Manage farm runoff', detail: 'Use balanced fertiliser doses, buffer strips and constructed wetlands to intercept nutrients.', icon: 'sprout' },
    { title: 'Segregate waste at source', detail: 'Keep plastics, e-waste and hazardous waste out of drains and landfills.', icon: 'trash-2' },
    { title: 'Protect wetlands and riverbanks', detail: 'Buffer zones filter pollutants, absorb floods and support biodiversity.', icon: 'trees' },
    { title: 'Monitor and publish data', detail: 'Regular, transparent water-quality monitoring lets communities hold polluters accountable.', icon: 'activity' },
    { title: 'Reduce single-use plastic', detail: 'Choose reusable bags, bottles and containers; support local refill options.', icon: 'package' },
    { title: 'Use water-efficient fixtures', detail: 'Low-flow taps, dual-flush toilets and aerators cut household demand.', icon: 'gauge' },
  ],
  standards: [
    { name: 'CPCB surface-water classes', detail: 'Class A (drinking after disinfection), B (outdoor bathing), C (drinking after treatment), D (fisheries), E (irrigation/industry).' },
    { name: 'BIS 10500:2012', detail: 'Indian drinking-water quality standard, with desirable and permissible limits.' },
    { name: 'Water (Prevention and Control of Pollution) Act, 1974', detail: 'Establishes CPCB and State Pollution Control Boards and regulates discharge into water bodies.' },
    { name: 'Namami Gange / local river action plans', detail: 'National and municipal programmes for sewage interception, treatment and riverfront restoration.' },
  ],
  references: [
    { label: 'CPCB — Water quality criteria and monitoring', url: 'https://cpcb.nic.in/' },
    { label: 'BIS 10500 drinking-water standard', url: 'https://bis.gov.in/' },
    { label: 'UN-Water — Water facts', url: 'https://www.unwater.org/water-facts' },
    { label: 'WHO — Drinking-water fact sheet', url: 'https://www.who.int/news-room/fact-sheets/detail/drinking-water' },
  ],
};
