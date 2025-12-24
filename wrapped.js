const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

function createIcon(iconSvg) {
  // wrapper div
  const wrapper = document.createElement('div');
  
  // SVG element and its attributes
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '64');
  svg.setAttribute('height', '64');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  
  // Parsing SVG path data
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(iconSvg, 'image/svg+xml');
  const paths = svgDoc.querySelectorAll('path, circle, line, rect, polyline, polygon');
  
  // Add each path element to our SVG
  paths.forEach(path => {
    const newPath = document.createElementNS('http://www.w3.org/2000/svg', path.tagName);
    Array.from(path.attributes).forEach(attr => {
      newPath.setAttribute(attr.name, attr.value);
    });
    svg.appendChild(newPath);
  });
  
  // Add the SVG to the wrapper
  wrapper.appendChild(svg);
  
  return wrapper;
} 

function checkExpiration() {
    const currentDate = new Date();
    const expirationDate = new Date('2026-01-01T00:00:00');
    
    if (currentDate >= expirationDate) {
      // Show expiration overlay
      const expiredOverlay = document.querySelector('.expired-overlay');
      expiredOverlay.style.display = 'flex';
      
      // Hide the loading indicator and main content
      document.getElementById('loading').style.display = 'none';
      document.getElementById('story-slides').style.display = 'none';
      
      // Add close button handler
      document.getElementById('closeExpiredBtn').addEventListener('click', () => {
        window.close();
      });
      
      // Add escape key handler
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          window.close();
        }
      });
      
      return true;
    }
    return false;
  }

  function initializeSharing() {
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const tweetBtn = document.getElementById('tweetBtn');
    
    const extensionUrl = "https://internetwrapped.com";
    
    copyLinkBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(extensionUrl);
        
        // Remove any existing success message first
        const existingMsg = document.querySelector('.copy-success');
        if (existingMsg) {
          existingMsg.remove();
        }
        
        // Create and add new success message
        const successMsg = document.createElement('div');
        successMsg.className = 'copy-success';
        successMsg.textContent = 'Link copied to clipboard!';
        document.body.appendChild(successMsg);
        
        // Remove success message after animation completes
        setTimeout(() => {
          const msg = document.querySelector('.copy-success');
          if (msg) {
            msg.remove();
          }
        }, 2000); // Matches the animation duration in CSS
    
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });

  
    tweetBtn.replaceWith(tweetBtn.cloneNode(true));
    
    const newTweetBtn = document.getElementById('tweetBtn');
    
    newTweetBtn.addEventListener('click', (e) => {
      // Prevent event bubbling
      e.preventDefault();
      e.stopPropagation();
      
      const tweetText = encodeURIComponent("Just wrapped up my 2025 Internet journey! Check out Internet Wrapped to discover your own online story! #InternetWrapped");
      const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(extensionUrl)}`;
      window.open(tweetUrl, '_blank');
    });
    
  
  }

async function analyzeHistory() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const history = await browserAPI.history.search({
    text: '',
    startTime: oneYearAgo.getTime(),
    maxResults: 100000
  });

  const stats = {
    totalVisits: history.length,
    byDomain: {},
    byHour: Array(24).fill(0),
    byDayOfWeek: Array(7).fill(0),
    byMonth: Array(12).fill(0),
    longestStreak: 0,
    topCategories: {},
    dailyAverage: 0,
    weekdayVsWeekend: { weekday: 0, weekend: 0 },
    morningVsNight: { morning: 0, night: 0 },
    busyDays: new Set()
  };

  history.forEach(item => {
    const url = new URL(item.url);
    const domain = url.hostname;
    const date = new Date(item.lastVisitTime);
    
    stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;
    
    stats.byHour[date.getHours()]++;
    stats.byDayOfWeek[date.getDay()]++;
    stats.byMonth[date.getMonth()]++;
    
    const hour = date.getHours();
    if (hour >= 6 && hour < 18) {
      stats.morningVsNight.morning++;
    } else {
      stats.morningVsNight.night++;
    }
    
    const day = date.getDay();
    if (day === 0 || day === 6) {
      stats.weekdayVsWeekend.weekend++;
    } else {
      stats.weekdayVsWeekend.weekday++;
    }
    
    const dateStr = date.toLocaleDateString();
    stats.busyDays.add(dateStr);
    
    const categories = categorizeUrl(url.toString());
    categories.forEach(category => {
      stats.topCategories[category] = (stats.topCategories[category] || 0) + 1;
    });
  });

  stats.dailyAverage = Math.round(stats.totalVisits / stats.busyDays.size);

  return processStats(stats);
}

function createConfetti() {
  const colors = ['#FFF', '#818cf8', '#c4b5fd', '#e0e7ff', '#93c5fd'];
  const shapes = ['square', 'triangle', 'circle'];
  const container = document.createElement('div');
  container.className = 'confetti-container';

  // Create 30 confetti pieces
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = `confetti ${shapes[Math.floor(Math.random() * shapes.length)]}`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.animationDelay = `${Math.random() * 2}s`;
    confetti.style.animationDuration = `${2.5 + Math.random() * 1.5}s`;
    container.appendChild(confetti);
  }

  return container;
}

function categorizeUrl(url) {
  const categories = [];
  // Parse URL to handle subdomains and paths correctly
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch (e) {
    // If URL parsing fails, fall back to lowercase string
    urlObj = { hostname: url.toLowerCase() };
  }
  
  const domain = urlObj.hostname.toLowerCase();

  const categoryPatterns = {
    'AI': /(?:^|\.)(?:openai|anthropic|friend|claude|chatgpt|bard\.google|gemini\.google|cohere|stability|midjourney|huggingface|replicate|perplexity|together|deepmind|mistral|meta\.ai|perplexity\.ai|forefront|scale|runway|jasper|writesonic|copy\.ai|synthesia|deepl|elevenlabs|leonardo|inflection|character\.ai|anthropic|claude-in-slack|docker\.anthropic|docker\.openai|api\.openai|api\.anthropic|platform\.openai|chat\.openai|labs\.openai|api\.stability|beta\.dreamstudio|api\.midjourney|weights\.replicate)(?:\.com|\.ai|\.org|\.io)?$/,
    'Social Media': /(?:^|\.)(facebook|twitter|x\.com|instagram|linkedin|tiktok|threads\.net|reddit|discord|snapchat|whatsapp|telegram|mastodon|tumblr|pinterest|quora)(?:\.com|\.org|\.net)?$/,
    'Shopping': /(?:^|\.)(amazon|ebay|etsy|shopify|walmart|target|bestbuy|aliexpress|wish|newegg|homedepot|wayfair|costco|ikea|zalando|asos|shein|temu|chewy)(?:\.com|\.co|\.org|\.net)?$/,
    'News': /(?:^|\.)(cnn|bbc|reuters|nytimes|theguardian|bloomberg|wsj|apnews|huffpost|forbes|businessinsider|vox|vice|theverge|techcrunch|engadget|wired|gizmodo)(?:\.com|\.co\.uk|\.org|\.net)?$/,
    'Tech': /(?:^|\.)(github|stackoverflow|dev\.to|medium|gitlab|bitbucket|npmjs|ycombinator|heroku|digitalocean|aws\.amazon|azure|vercel|netlify|cloudflare|codepen|replit|freecodecamp|w3schools|mozilla)(?:\.com|\.org|\.net|\.io)?$/,
    'Entertainment': /(?:^|\.)(youtube|netflix|spotify|hulu|disney|twitch|vimeo|crunchyroll|funimation|soundcloud|pandora|music\.apple|deezer|primevideo|hbomax|peacocktv|paramount|tidal|bandcamp)(?:\.com|\.tv|\.net)?$/,
    'Productivity': /(?:^|\.)(google\.(com|co|docs)|notion|trello|asana|monday|slack|zoom|teams|dropbox|box|evernote|todoist|clickup|linear|miro|figma|canva|airtable)(?:\.com|\.so|\.app)?$/,
    'Education': /(?:^|\.)(coursera|udemy|edx|khanacademy|brilliant|duolingo|codecademy|pluralsight|skillshare|masterclass|udacity|lynda|mit|stanford|harvard|coursehero|chegg|quizlet|brainly)(?:\.com|\.org|\.edu)?$/,
    'Email': /(?:^|\.)(gmail|outlook|yahoo|proton|hotmail|aol|zoho|fastmail|tutanota)(?:\.com|\.net)?$/,
    'Gaming': /(?:^|\.)(steampowered|epicgames|xbox|playstation|nintendo|roblox|minecraft|ign|gamespot|polygon|kotaku|unity|unrealengine|itch\.io|gog|blizzard|ea|ubisoft|riotgames)(?:\.com|\.net)?$/,
    'Finance': /(?:^|\.)(paypal|venmo|cash|robinhood|coinbase|binance|chase|bankofamerica|wellsfargo|mint|creditkarma|fidelity|vanguard|schwab|wise|revolut)(?:\.com|\.app)?$/,
    'Travel': /(?:^|\.)(airbnb|booking|expedia|kayak|tripadvisor|hotels|uber|lyft|maps\.google|southwest|delta|united|aa|airfrance|britishairways)(?:\.com|\.co\.uk)?$/,
    'Sports': /(?:^|\.)(espn|sports\.yahoo|nba|nfl|mlb|fifa|uefa|skysports|draftkings|fanduel|bleacherreport|cbssports|nbcsports|goal)(?:\.com|\.co\.uk)?$/,
    'Health': /(?:^|\.)(fitbit|myfitnesspal|strava|nike|adidas|webmd|mayoclinic|healthline|meditation|calm|headspace)(?:\.com|\.org)?$/,
    'Food': /(?:^|\.)(doordash|ubereats|grubhub|instacart|allrecipes|foodnetwork|yelp|opentable|seamless|deliveroo)(?:\.com|\.co\.uk)?$/,
    'Development': /(?:^|\.)(localhost|127\.0\.0\.1|nginx|apache|webpack|yarnpkg|babeljs|reactjs|vuejs|angular|svelte|tensorflow|kubernetes|docker)(?:\.org|\.io|\.com)?$/
  };

  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(domain)) {
      categories.push(category);
    }
  }

  return categories.length ? categories : ['Other'];
}

function processStats(stats) {
  const cleanDomain = (domain) => domain.replace(/^www\./, '');
  
  const topDomains = Object.entries(stats.byDomain)
    .map(([domain, count]) => [cleanDomain(domain), count])
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const peakHour = stats.byHour.indexOf(Math.max(...stats.byHour));
  
  const favDay = stats.byDayOfWeek.indexOf(Math.max(...stats.byDayOfWeek));
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const topCategories = Object.entries(stats.topCategories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  const dayNightRatio = Math.round(
    (stats.morningVsNight.morning / stats.totalVisits) * 100
  );
  
  const weekdayRatio = Math.round(
    (stats.weekdayVsWeekend.weekday / 
    (stats.weekdayVsWeekend.weekday + stats.weekdayVsWeekend.weekend)) * 100
  );

  return {
    totalVisits: stats.totalVisits,
    dailyAverage: stats.dailyAverage,
    topDomains,
    peakHour,
    favDay: days[favDay],
    topCategories,
    dayNightRatio,
    weekdayRatio,
    activeDays: stats.busyDays.size
  };
}

function createStorySlide(content, index) {
  const backgrounds = [
    'linear-gradient(135deg, #7c3aed, #6366f1)',
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #5b21b6, #7c3aed)',
    'linear-gradient(135deg, #a855f7, #6366f1)',
    'linear-gradient(135deg, #4f46e5, #a78bfa)',
    'linear-gradient(135deg, #8b5cf6, #a855f7)',
    'linear-gradient(135deg, #4338ca, #9333ea)',
    'linear-gradient(135deg, #7c3aed, #6366f1)',
    'linear-gradient(135deg, #9333ea, #c4b5fd)',
    'linear-gradient(135deg, #6d28d9, #8b5cf6)',
  ];

  const storyContent = document.createElement('div');
  storyContent.className = 'story-content';
  storyContent.style.background = backgrounds[index % backgrounds.length];

  const innerContent = document.createElement('div');
  innerContent.className = 'story-content-inner';

  return { storyContent, innerContent };
}

function hideIntroOverlay() {
  const introOverlay = document.querySelector('.intro-overlay');
  introOverlay.style.opacity = '0';
  introOverlay.style.pointerEvents = 'none';
  setTimeout(() => {
    introOverlay.style.display = 'none';
  }, 500);
}

function displayStats(stats) {
  const slidesContainer = document.getElementById('story-slides');
  document.getElementById('loading').style.display = 'none';
  slidesContainer.style.display = 'block';

  // Clear existing content
  while (slidesContainer.firstChild) {
    slidesContainer.removeChild(slidesContainer.firstChild);
  }

  function createSafeElement(tag, className = '', text = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function createSlideContent(index) {
    const { storyContent, innerContent } = createStorySlide('', index);
    const h3 = createSafeElement('h3');
    const statValue = createSafeElement('div', 'stat-value');
    const statDesc = createSafeElement('div', 'stat-description');
  
    const iconContainer = createSafeElement('div', 'icon-container');
    iconContainer.style.marginBottom = '20px';

    const categoryIcons = {
      'AI': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>`,
      'Social Media': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
      'Shopping': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,    
      'News': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path></svg>`,
      
      'Tech': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
      
      'Entertainment': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
      
      'Productivity': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
      
      'Education': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
      
      'Email': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
      
      'Gaming': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="11" x2="10" y2="11"></line><line x1="8" y1="9" x2="8" y2="13"></line><line x1="15" y1="12" x2="15.01" y2="12"></line><line x1="18" y1="10" x2="18.01" y2="10"></line><path d="M17.32 5H6.68a4 4 0 00-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 003 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 019.828 16h4.344a2 2 0 011.414.586L17 18c.5.5 1 1 2 1a3 3 0 003-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0017.32 5z"></path></svg>`,
      
      'Finance': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
      
      'Travel': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
      
      'Sports': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>`,
      
      'Health': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`,
      
      'Food': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
      
      'Development': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
      
      'Other': `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };
    
    // icons for each slide
    const icons = {
      0: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
      1: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg>`,
      2: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
      3: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
      4: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
      5: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
      6: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
      7: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
      8: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
      9: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
    };
  
    // slide-specific classes and animations
    switch(index) {
      case 0: // Welcome slide
        innerContent.classList.add('welcome-slide');
        h3.className = 'welcome-title';
        statValue.className = 'stat-value welcome-year';
        statDesc.className = 'stat-description welcome-subtitle';

        // Adding confetti anim
        const confetti0 = createConfetti();
        storyContent.appendChild(confetti0);

        setTimeout(() => {
          confetti0.remove();
        }, 5000);
        break;
        
      case 1: // Numbers slide
        innerContent.classList.add('numbers-slide');

        // Adding confetti for big numbers
        const confetti1 = createConfetti();
        storyContent.appendChild(confetti1);

        setTimeout(() => {
          confetti1.remove();
        }, 5000);
        break;
        
      case 2: // Most active day
        innerContent.classList.add('day-slide');
        break;
        
      case 5: // Top sites
        innerContent.classList.add('sites-slide');
        break;
        
      case 6: // Peak time
        innerContent.classList.add('time-slide');
        break;
        
      case 7: // Day/Night ratio
        innerContent.classList.add('daynight-slide');
        break;
        
      case 9: // Categories
        innerContent.classList.add('category-slide');

        // Adding confetti for category celebration
        const confetti9 = createConfetti();
        storyContent.appendChild(confetti9);

        setTimeout(() => {
          confetti9.remove();
        }, 5000);
        break;
    }
  
    // content based on slide index
    switch(index) {
      case 0:
        h3.textContent = 'Welcome to Your';
        statValue.textContent = '2025';
        statDesc.textContent = 'Internet Wrapped';
        break;
  
      case 1:
        h3.textContent = 'Your Year in Numbers';
        statValue.textContent = stats.totalVisits.toLocaleString();
        statDesc.textContent = `pages visited across ${stats.activeDays} days`;
        break;
  
      case 2:
        h3.textContent = 'Most Active Day';
        statValue.textContent = stats.favDay;
        statDesc.textContent = 'is your busiest day online';
        break;
  
      case 3:
        h3.textContent = 'Daily Explorer';
        statValue.textContent = stats.dailyAverage.toString();
        statDesc.textContent = 'pages visited on average each day';
        break;
  
      case 4:
        h3.textContent = 'Your Most Visited Site';
        statValue.textContent = stats.topDomains[0][0];
        if (stats.topDomains[0][0].length > 20) {
          statValue.classList.add('long-text');
        }
        statDesc.textContent = `with ${stats.topDomains[0][1].toLocaleString()} visits`;
        break;
  
      case 5:
        h3.textContent = 'Most Visited Sites';
        iconContainer.appendChild(createIcon(icons[index]));
        if (iconContainer.firstChild?.firstChild) {
          iconContainer.firstChild.firstChild.setAttribute('style', 'color: white; opacity: 0.9;');
        }
        innerContent.appendChild(iconContainer);
        innerContent.appendChild(h3);
        
        const totalVisits = stats.topDomains.slice(0, 5)
          .reduce((sum, [, visits]) => sum + visits, 0);
        
        stats.topDomains.slice(0, 5).forEach(([domain, visits], i) => {
          const siteItem = createSafeElement('div', 'site-item');
          const siteDomain = createSafeElement('div', 'site-domain', domain);
          const progressBar = createSafeElement('div', 'site-progress-bar');
          const progressFill = createSafeElement('div', 'site-progress-fill');
          
          const percentage = (visits / totalVisits) * 100;
          progressFill.style.width = `${percentage}%`;
          siteItem.style.animationDelay = `${i * 0.1}s`;
          
          progressBar.appendChild(progressFill);
          siteItem.appendChild(siteDomain);
          siteItem.appendChild(progressBar);
          innerContent.appendChild(siteItem);
        });
        break; 
  
        case 6:
          h3.textContent = 'Peak Browsing Time';
          // Converting 24hr time to AM/PM format
          const hour = stats.peakHour;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12; 
          statValue.textContent = `${displayHour}:00 ${ampm}`;
          statDesc.textContent = 'is when you\'re most active online';
          break;
  
      case 7:
        h3.textContent = 'Day vs Night';
        statValue.textContent = `${stats.dayNightRatio}%`;
        statDesc.textContent = 'of your browsing happens during daytime';
        break;
  
      case 8:
        h3.textContent = 'Work-Life Balance';
        statValue.textContent = `${stats.weekdayRatio}%`;
        statDesc.textContent = 'of your browsing occurs on weekdays';
        break;
  
        case 9:
          h3.textContent = 'Your Top Category';
          const topCategory = stats.topCategories[0][0];
          statValue.textContent = topCategory;
          const categoryPercentage = Math.round((stats.topCategories[0][1] / stats.totalVisits) * 100);
          statDesc.textContent = `${categoryPercentage}% of your browsing`;
          
          // Setting icon based on category
          const icon = categoryIcons[topCategory] || categoryIcons['Other'];
          const iconWrapper = createIcon(icon);
          iconContainer.replaceChildren(iconWrapper);
          if (iconContainer.firstChild?.firstChild) {
            iconContainer.firstChild.firstChild.style.color = 'white';
            iconContainer.firstChild.firstChild.style.opacity = '0.9';
          }
          iconContainer.firstChild?.setAttribute('style', 'color: white; opacity: 0.9;');
          innerContent.appendChild(iconContainer);
          innerContent.appendChild(h3);
          innerContent.appendChild(statValue);
          innerContent.appendChild(statDesc);
          storyContent.appendChild(innerContent);
          return storyContent;
    }
  
    // Adding particles background for all slides
    const particles = document.createElement('div');
    particles.className = 'particles-background';
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 12}s`;
      particles.appendChild(particle);
    }
    storyContent.appendChild(particles);
  
    if (index !== 5) {
      if (icons[index]) {
        const iconWrapper = createIcon(icons[index]);
        iconContainer.replaceChildren(iconWrapper);
        const svgElement = iconContainer.querySelector('svg');
        if (svgElement) {
          svgElement.style.color = 'white';
          svgElement.style.opacity = '0.9';
        }
      }
      iconContainer.firstChild?.setAttribute('style', 'color: white; opacity: 0.9;');
      innerContent.appendChild(iconContainer);
      innerContent.appendChild(h3);
      innerContent.appendChild(statValue);
      innerContent.appendChild(statDesc);
    }
  
    storyContent.appendChild(innerContent);
    return storyContent;
  }

  // Creating all slides
  for (let i = 0; i <= 9; i++) {
    const slide = createSlideContent(i);
    slidesContainer.appendChild(slide);
  }
  
  let currentSlide = 0;
  const allSlides = slidesContainer.children;
  const progressSegments = document.querySelectorAll('.progress-segment');
  let timer = null;

  // Resetting all progress segments
  progressSegments.forEach(segment => {
    segment.classList.remove('active', 'completed');
  });
  
  // Initializing first slide
  allSlides[0].style.display = 'flex';
  allSlides[0].classList.add('active');
  for(let i = 1; i < allSlides.length; i++) {
    allSlides[i].style.display = 'none';
  }

  function showEndOverlay() {
    const overlay = document.querySelector('.end-overlay');
    overlay.style.display = 'flex';
    initializeSharing();
  }

  function hideEndOverlay() {
    const overlay = document.querySelector('.end-overlay');
    overlay.style.display = 'none';
  }

  function restartPresentation() {
    hideEndOverlay();

    // Clearing any existing timer
    if (timer) clearInterval(timer);

    currentSlide = 0;

    // Resetting all slides
    for(let i = 0; i < allSlides.length; i++) {
      allSlides[i].style.display = 'none';
      allSlides[i].classList.remove('active');
    }

    // Resetting progress segments
    progressSegments.forEach(segment => {
      segment.classList.remove('active', 'completed');
    });

    // Showing first slide
    allSlides[0].style.display = 'flex';
    allSlides[0].classList.add('active');

    // Restarting progress animation with a slight delay to ensure clean start
    setTimeout(() => {
      // Forcing reflow for clean animation
      void progressSegments[0].offsetWidth;
      progressSegments[0].classList.add('active');

      // Starting the auto-scroll timer fresh
      timer = setInterval(() => {
        if(currentSlide < allSlides.length - 1) {
          showSlide(currentSlide + 1);
        } else {
          clearInterval(timer);
          showEndOverlay();
        }
      }, 5000);
    }, 100);
  }

  function showSlide(index) {
    if(index >= 0 && index < allSlides.length) {
        if (timer) clearInterval(timer);

        // Updating progress segments
        progressSegments.forEach((segment, i) => {
            if (i < index) {
                segment.classList.remove('active');
                segment.classList.add('completed');
            } else if (i === index) {
                segment.classList.remove('active', 'completed');
                void segment.offsetWidth;
                segment.classList.add('active');
            } else {
                segment.classList.remove('active', 'completed');
            }
        });

        const currentElement = allSlides[currentSlide];
        const nextElement = allSlides[index];

        // Remove active class from current
        currentElement.classList.remove('active');

        // Setting initial state for next element
        nextElement.style.display = 'flex';

        // Use requestAnimationFrame for smoother transition
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Add active class to next element
                nextElement.classList.add('active');

                // After transition completes
                setTimeout(() => {
                    currentElement.style.display = 'none';
                    currentSlide = index;
                }, 400);
            });
        });

        startTimer();
    }
}

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if(currentSlide < allSlides.length - 1) {
        showSlide(currentSlide + 1);
      } else {
        clearInterval(timer);
        showEndOverlay();
      }
    }, 5000);
  }

  // Navigation event listeners
  document.getElementById('prevSlide').addEventListener('click', () => {
    showSlide(currentSlide - 1);
  });

  document.getElementById('nextSlide').addEventListener('click', () => {
    if (currentSlide === allSlides.length - 1) {
      showEndOverlay();
    } else {
      showSlide(currentSlide + 1);
    }
  });

  // Add tap zones for Instagram-style navigation
  const storyContainer = document.querySelector('.story-container');
  storyContainer.addEventListener('click', (e) => {
    const rect = storyContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const containerWidth = rect.width;

    // If click is in left third, go back
    if (clickX < containerWidth / 3) {
      if (currentSlide > 0) {
        showSlide(currentSlide - 1);
      }
    }
    // If click is in right two-thirds, go forward
    else if (clickX > containerWidth / 3) {
      if (currentSlide === allSlides.length - 1) {
        showEndOverlay();
      } else {
        showSlide(currentSlide + 1);
      }
    }
  });
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      showSlide(currentSlide - 1);
    } else if (e.key === 'ArrowRight') {
      if (currentSlide === allSlides.length - 1) {
        showEndOverlay();
      } else {
        showSlide(currentSlide + 1);
      }
    } else if (e.key === 'Escape') {
      window.close();
    }
  });

  // Handling visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (timer) clearInterval(timer);
    } else {
      startTimer();
    }
  });

 
  slidesContainer.addEventListener('mouseenter', () => {
    if (timer) clearInterval(timer);
  });

  slidesContainer.addEventListener('mouseleave', () => {
    startTimer();
  });

  // End overlay button handlers
  document.getElementById('restartBtn').addEventListener('click', restartPresentation);
  document.getElementById('exitBtn').addEventListener('click', () => {
    window.close();
  });

  // Starting the first progress bar
  setTimeout(() => {
    void progressSegments[0].offsetWidth; 
    progressSegments[0].classList.add('active');
    startTimer();
  }, 100);
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    
    checkExpiration()

    // Hiding the stories initially
    document.getElementById('story-slides').style.display = 'none';
    document.getElementById('loading').style.display = 'none';

    //click handler for start button
    document.getElementById('startBtn').addEventListener('click', async () => {
      hideIntroOverlay();
      document.getElementById('loading').style.display = 'flex';
      
      // minimum loading time of 2 seconds for better UX
      const [stats] = await Promise.all([
        analyzeHistory(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      displayStats(stats);
    });

  } catch (error) {
    document.getElementById('loading').textContent = 'Error analyzing history: ' + error.message;
  }
});