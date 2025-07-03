// 内容脚本 - 检测网页中的期刊信息

// 页面级别的弹出状态跟踪
let hasAutoPopped = false;
let currentPageUrl = window.location.href;

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'detectJournal') {
        const journalInfo = detectJournalFromPage();
        sendResponse(journalInfo);
    }
});

// 从当前页面检测期刊信息
function detectJournalFromPage() {
    const url = window.location.href;
    const title = document.title;
    const hostname = window.location.hostname;
    
    let journalName = null;
    
    // 检测不同学术网站的期刊信息
    if (hostname.includes('nature.com')) {
        journalName = detectNatureJournal();
    } else if (hostname.includes('science.org') || hostname.includes('sciencemag.org')) {
        journalName = detectScienceJournal();
    } else if (hostname.includes('ieee.org')) {
        journalName = detectIEEEJournal();
    } else if (hostname.includes('acm.org')) {
        journalName = detectACMJournal();
    } else if (hostname.includes('springer.com') || hostname.includes('link.springer.com')) {
        journalName = detectSpringerJournal();
    } else if (hostname.includes('sciencedirect.com')) {
        journalName = detectScienceDirectJournal();
    } else if (hostname.includes('wiley.com')) {
        journalName = detectWileyJournal();
    } else if (hostname.includes('tandfonline.com')) {
        journalName = detectTaylorFrancisJournal();
    } else if (hostname.includes('plos.org')) {
        journalName = detectPLOSJournal();
    } else if (hostname.includes('pubmed.ncbi.nlm.nih.gov')) {
        journalName = detectPubMedJournal();
    } else if (hostname.includes('mdpi.com')) {
        journalName = detectMDPIJournal();
    } else {
        // 通用检测方法
        journalName = detectGenericJournal();
    }
    
    return {
        journalName: journalName,
        url: url,
        title: title,
        hostname: hostname
    };
}

// Nature系列期刊检测
function detectNatureJournal() {
    // 从URL路径检测
    const path = window.location.pathname;
    if (path.includes('/ncomms/')) return 'Nature Communications';
    if (path.includes('/nmeth/')) return 'Nature Methods';
    if (path.includes('/nphys/')) return 'Nature Physics';
    if (path.includes('/nchem/')) return 'Nature Chemistry';
    
    // 从页面标题检测
    const title = document.title.toLowerCase();
    if (title.includes('nature communications')) return 'Nature Communications';
    if (title.includes('nature methods')) return 'Nature Methods';
    if (title.includes('nature physics')) return 'Nature Physics';
    if (title.includes('nature chemistry')) return 'Nature Chemistry';
    
    // 从期刊名称元素检测
    const journalElements = document.querySelectorAll('h1, .journal-title, .publication-title, [data-test="journal-title"]');
    for (const element of journalElements) {
        const text = element.textContent.toLowerCase();
        if (text.includes('nature')) {
            return element.textContent.trim();
        }
    }
    
    return 'Nature';
}

// Science系列期刊检测
function detectScienceJournal() {
    const title = document.title.toLowerCase();
    if (title.includes('science advances')) return 'Science Advances';
    
    const journalElements = document.querySelectorAll('.journal-title, .pub-title, h1');
    for (const element of journalElements) {
        const text = element.textContent.toLowerCase();
        if (text.includes('science advances')) return 'Science Advances';
        if (text.includes('science')) return 'Science';
    }
    
    return 'Science';
}

// IEEE期刊检测
function detectIEEEJournal() {
    console.log('开始IEEE期刊检测...');
    
    // 1. 优先检查meta标签 - 最准确的来源
    const metaSelectors = [
        'meta[name="citation_journal_title"]',
        'meta[name="dc.source"]',
        'meta[property="citation_journal_title"]',
        'meta[name="prism.publicationName"]'
    ];
    
    for (const selector of metaSelectors) {
        const meta = document.querySelector(selector);
        if (meta) {
            const content = meta.getAttribute('content');
            if (content && content.trim() && !content.includes('IEEE Journals & Magazine')) {
                console.log('从meta标签检测到期刊:', content);
                return content.trim();
            }
        }
    }
    
    // 2. 检查特定的IEEE期刊页面元素
    const ieeeSelectors = [
        // IEEE Xplore特定选择器
        '.stats-document-abstract-publishedIn a',
        '.stats-document-lh-action-primary_1 a[href*="punumber"]',
        '.document-banner-metric-link',
        '.publication-link',
        '.stats-document-abstract-doi + div a',
        // 期刊标题相关选择器  
        '.publication-title',
        '.document-title .publication-title',
        '.journal-title',
        'h1.publication-title',
        // 通用选择器
        '[data-testid="publication-link"]',
        '.document-abstract-container .publication-title'
    ];
    
    for (const selector of ieeeSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.textContent.trim();
            // 过滤掉通用标题，寻找具体期刊名
            if (text && 
                text.length > 10 && 
                text.length < 200 && 
                !text.includes('IEEE Journals & Magazine') &&
                !text.includes('IEEE Xplore') &&
                (text.includes('IEEE') || text.includes('Transactions') || text.includes('Journal') || text.includes('Letters'))) {
                console.log('从页面元素检测到期刊:', text);
                return text;
            }
        }
    }
    
    // 3. 从URL路径中提取期刊信息
    const path = window.location.pathname;
    const urlMatch = path.match(/\/xpl\/RecentIssue\.jsp\?punumber=(\d+)/);
    if (urlMatch) {
        // 如果是期刊主页，查找期刊标题
        const journalTitleElement = document.querySelector('h1, .publication-title, .journal-title');
        if (journalTitleElement) {
            const title = journalTitleElement.textContent.trim();
            if (title && !title.includes('IEEE Journals & Magazine')) {
                console.log('从期刊主页检测到期刊:', title);
                return title;
            }
        }
    }
    
    // 4. 从页面标题中提取具体期刊名称（排除通用标题）
    const title = document.title;
    if (title.includes('IEEE')) {
        // 匹配IEEE期刊名称模式
        const patterns = [
            /IEEE\s+Transactions?\s+on\s+[^|]*/i,
            /IEEE\s+Journal\s+of\s+[^|]*/i,
            /IEEE\s+[A-Z][^|]*Letters/i,
            /IEEE\s+Access/i,
            /IEEE\s+[A-Z][^|]*Magazine/i
        ];
        
        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                const journalName = match[0].trim();
                if (!journalName.includes('IEEE Journals & Magazine')) {
                    console.log('从页面标题检测到期刊:', journalName);
                    return journalName;
                }
            }
        }
    }
    
    // 5. 最后检查是否有任何包含具体期刊信息的链接
    const links = document.querySelectorAll('a[href*="punumber"], a[href*="journal"]');
    for (const link of links) {
        const text = link.textContent.trim();
        if (text && 
            text.length > 15 && 
            text.length < 150 && 
            !text.includes('IEEE Journals & Magazine') &&
            !text.includes('Browse') &&
            (text.includes('IEEE Transactions') || text.includes('IEEE Journal') || text.includes('IEEE Letters'))) {
            console.log('从链接检测到期刊:', text);
            return text;
        }
    }
    
    console.log('IEEE期刊检测失败');
    return null;
}

// ACM期刊检测
function detectACMJournal() {
    const journalElements = document.querySelectorAll('.issue-item__detail a, .publication-title, h1');
    for (const element of journalElements) {
        const text = element.textContent.trim();
        if (text.includes('ACM')) {
            return text;
        }
    }
    return null;
}

// Springer期刊检测
function detectSpringerJournal() {
    const journalElements = document.querySelectorAll('.JournalTitle, .app-journal-masthead__title, h1');
    for (const element of journalElements) {
        if (element.textContent.trim()) {
            return element.textContent.trim();
        }
    }
    return null;
}

// ScienceDirect期刊检测
function detectScienceDirectJournal() {
    const journalElements = document.querySelectorAll('.publication-title-link, .journal-title, h1');
    for (const element of journalElements) {
        if (element.textContent.trim()) {
            return element.textContent.trim();
        }
    }
    return null;
}

// Wiley期刊检测
function detectWileyJournal() {
    const journalElements = document.querySelectorAll('.journal-banner__title, .publication-title, h1');
    for (const element of journalElements) {
        if (element.textContent.trim()) {
            return element.textContent.trim();
        }
    }
    return null;
}

// Taylor & Francis期刊检测
function detectTaylorFrancisJournal() {
    const journalElements = document.querySelectorAll('.journal-heading, .publication-title, h1');
    for (const element of journalElements) {
        if (element.textContent.trim()) {
            return element.textContent.trim();
        }
    }
    return null;
}

// PLOS期刊检测
function detectPLOSJournal() {
    const title = document.title.toLowerCase();
    if (title.includes('plos one')) return 'PLOS ONE';
    if (title.includes('plos')) {
        const match = title.match(/plos\s+\w+/i);
        if (match) return match[0];
    }
    return 'PLOS ONE';
}

// PubMed期刊检测
function detectPubMedJournal() {
    const journalElements = document.querySelectorAll('.journal-title, .cit, button[title*="journal"]');
    for (const element of journalElements) {
        const text = element.textContent.trim();
        if (text && !text.includes('PubMed') && text.length > 3) {
            return text;
        }
    }
    return null;
}

// MDPI期刊检测
function detectMDPIJournal() {
    console.log('开始MDPI期刊检测...');
    
    // 1. 优先检查meta标签 - 最准确的来源
    const metaSelectors = [
        'meta[name="citation_journal_title"]',
        'meta[name="dc.source"]',
        'meta[property="citation_journal_title"]',
        'meta[name="prism.publicationName"]',
        'meta[name="DC.Source"]'
    ];
    
    for (const selector of metaSelectors) {
        const meta = document.querySelector(selector);
        if (meta) {
            const content = meta.getAttribute('content');
            if (content && content.trim()) {
                console.log('从MDPI meta标签检测到期刊:', content);
                return content.trim();
            }
        }
    }
    
    // 2. 从URL路径检测MDPI期刊名称
    const path = window.location.pathname.toLowerCase();
    const urlPatterns = [
        // MDPI期刊URL模式：/journal/sensors, /journal/materials等
        /\/journal\/([^\/]+)/i,
        // 文章URL模式：/1424-8220/xx/xx/xxxx (Sensors的ISSN)
        /\/(\d{4}-\d{4})\//
    ];
    
    for (const pattern of urlPatterns) {
        const match = path.match(pattern);
        if (match) {
            let journalId = match[1];
            
            // 处理ISSN到期刊名称的映射
            const issnToJournal = {
                '1424-8220': 'Sensors',
                '1996-1944': 'Materials', 
                '2071-1050': 'Sustainability',
                '2076-3417': 'Applied Sciences',
                '1422-0067': 'International Journal of Molecular Sciences',
                '2072-4292': 'Remote Sensing',
                '1661-6596': 'International Journal of Environmental Research and Public Health',
                '2073-4441': 'Water',
                '2073-8994': 'Symmetry',
                '1999-4923': 'Pharmaceuticals',
                '2227-9059': 'Biomedicines',
                '2079-6382': 'Antibiotics',
                '2072-6643': 'Nutrients',
                '2076-3921': 'Entropy',
                '1996-1073': 'Crystals',
                '2073-4360': 'Polymers'
            };
            
            if (issnToJournal[journalId]) {
                console.log('从MDPI URL ISSN检测到期刊:', issnToJournal[journalId]);
                return issnToJournal[journalId];
            } else if (journalId.length > 2) {
                // 直接从URL路径获取期刊名称，首字母大写
                const journalName = journalId.charAt(0).toUpperCase() + journalId.slice(1);
                console.log('从MDPI URL路径检测到期刊:', journalName);
                return journalName;
            }
        }
    }
    
    // 3. 检查MDPI页面的特定元素
    const mdpiSelectors = [
        // MDPI网站特定的期刊标题选择器
        '.journal-title',
        '.journal-head h1',
        '.article-title .journal-title',
        '.breadcrumb .journal',
        '.article-top .journal-name',
        'h1.journal-name',
        '.pub-title',
        '.journal-banner h1',
        // 新版MDPI网站选择器
        '.journal-info h1',
        '.header-journal-title',
        '[data-testid="journal-title"]'
    ];
    
    for (const selector of mdpiSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.textContent.trim();
            if (text && text.length > 2 && text.length < 100 && 
                !text.toLowerCase().includes('mdpi') &&
                !text.toLowerCase().includes('article') &&
                !text.toLowerCase().includes('issue')) {
                console.log('从MDPI页面元素检测到期刊:', text);
                return text;
            }
        }
    }
    
    // 4. 从页面标题中提取期刊名称
    const title = document.title;
    const titlePatterns = [
        // "Sensors | An Open Access Journal from MDPI"
        /^([^|]+)\s*\|\s*.*MDPI/i,
        // "Article Title - Sensors"
        /.*?\s*-\s*([^-]+)$/i,
        // "Sensors - MDPI"
        /^([^-]+)\s*-\s*MDPI/i
    ];
    
    for (const pattern of titlePatterns) {
        const match = title.match(pattern);
        if (match) {
            const journalName = match[1].trim();
            // 验证是否是合理的期刊名称
            if (journalName && journalName.length > 2 && journalName.length < 50 &&
                !journalName.toLowerCase().includes('article') &&
                !journalName.toLowerCase().includes('homepage')) {
                console.log('从MDPI页面标题检测到期刊:', journalName);
                return journalName;
            }
        }
    }
    
    // 5. 检查面包屑导航
    const breadcrumbs = document.querySelectorAll('.breadcrumb a, .breadcrumb-item a, nav a');
    for (const breadcrumb of breadcrumbs) {
        const text = breadcrumb.textContent.trim();
        const href = breadcrumb.getAttribute('href') || '';
        
        // 如果链接指向期刊主页且文本是期刊名称
        if (href.includes('/journal/') && text && text.length > 2 && text.length < 50) {
            console.log('从MDPI面包屑检测到期刊:', text);
            return text;
        }
    }
    
    console.log('MDPI期刊检测失败');
    return null;
}

// 通用期刊检测方法
function detectGenericJournal() {
    // 常见的期刊名称选择器
    const selectors = [
        '.journal-title',
        '.publication-title',
        '.journal-name',
        '.journal',
        '[class*="journal"]',
        '[id*="journal"]',
        'meta[name="citation_journal_title"]',
        'meta[name="dc.source"]',
        'meta[property="og:site_name"]'
    ];
    
    // 检查meta标签
    const metaTags = document.querySelectorAll('meta[name="citation_journal_title"], meta[name="dc.source"], meta[property="citation_journal_title"], meta[name="prism.publicationName"]');
    for (const meta of metaTags) {
        const content = meta.getAttribute('content');
        if (content && content.trim() && !content.includes('IEEE Journals & Magazine')) {
            return content.trim();
        }
    }
    
    // 检查其他选择器
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.textContent.trim();
            if (text && text.length > 3 && text.length < 200) {
                return text;
            }
        }
    }
    
    // 从URL中提取可能的期刊信息
    if (hostname.includes('journal')) {
        const parts = hostname.split('.');
        for (const part of parts) {
            if (part.includes('journal') && part.length > 7) {
                return part.replace('journal', '').replace('-', ' ').trim();
            }
        }
    }
    
    return null;
}

// 页面加载完成后自动检测
function initAutoDetection() {
    console.log('期刊检测插件已加载，开始自动检测');
    
    // 多重检测策略，确保捕获到页面内容
    setTimeout(() => {
        console.log('第一次检测...');
        autoDetectAndPopup();
    }, 1000);
    
    // 页面可能动态加载内容，再次检测
    setTimeout(() => {
        console.log('第二次检测...');
        autoDetectAndPopup();
    }, 3000);
}

// 多种页面加载事件监听
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoDetection);
} else {
    // 页面已经加载完成
    initAutoDetection();
}

// 监听页面加载完成
window.addEventListener('load', function() {
    console.log('页面完全加载，延迟检测');
    setTimeout(() => {
        autoDetectAndPopup();
    }, 2000);
});

// 监听URL变化（适用于单页应用）
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        console.log('检测到URL变化（SPA导航）:', lastUrl, '->', url);
        lastUrl = url;
        // URL变化时重置弹出状态
        hasAutoPopped = false;
        currentPageUrl = url;
        // 延迟检测新页面
        setTimeout(() => {
            console.log('URL变化后延迟检测...');
            autoDetectAndPopup();
        }, 1500);
    }
}).observe(document, { subtree: true, childList: true });

// 监听浏览器前进后退按钮
window.addEventListener('popstate', function() {
    console.log('检测到浏览器导航事件');
    hasAutoPopped = false;
    currentPageUrl = window.location.href;
    setTimeout(() => {
        console.log('导航事件后延迟检测...');
        autoDetectAndPopup();
    }, 1000);
});

// 监听页面可见性变化（标签页切换回来时）
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && !hasAutoPopped) {
        console.log('页面变为可见，进行检测');
        setTimeout(() => {
            autoDetectAndPopup();
        }, 500);
    }
});

// 检测当前页面是否为文献页面
function isLiteraturePage() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    
    // console.log('检测文献页面 - URL:', url);
    // console.log('检测文献页面 - 域名:', hostname);
    
    // 检测常见学术文献页面的特征
    const literatureIndicators = [
        // URL关键词
        '/article/', '/paper/', '/doi/', '/abs/', '/full/', '/science/',
        '/nature/', '/ieee/', '/acm/', '/springer/', '/elsevier/',
        '/wiley/', '/taylor/', '/sage/', '/acs/', '/rsc/', '/osa/',
        '/aps/', '/aip/', '/asm/', '/asme/', '/agu/', '/copernicus/',
        
        // 域名关键词
        'sciencedirect', 'springer', 'ieee', 'acm', 'nature', 'science',
        'wiley', 'tandfonline', 'sagepub', 'acs', 'rsc', 'osa', 'aps',
        'aip', 'ascelibrary', 'asmedigitalcollection', 'copernicus',
        'mdpi', 'frontiersin', 'plos', 'bmj', 'nejm', 'thelancet',
        'cell', 'sciencemag', 'pubmed', 'arxiv'
    ];
    
    // 检查URL和主机名
    const urlCheck = literatureIndicators.some(indicator => {
        const matches = url.includes(indicator) || hostname.includes(indicator);
        if (matches) {
            console.log('匹配到文献指标:', indicator);
        }
        return matches;
    });
    
    // 检查页面元素特征
    const hasDoiMeta = document.querySelector('meta[name*="doi" i], meta[property*="doi" i]');
    const hasArticleMeta = document.querySelector('meta[name*="article" i], meta[property*="article" i]');
    const hasCitationMeta = document.querySelector('meta[name*="citation" i]');
    
    console.log('DOI meta:', !!hasDoiMeta);
    console.log('Article meta:', !!hasArticleMeta);
    console.log('Citation meta:', !!hasCitationMeta);
    
    const isLiterature = urlCheck || hasDoiMeta || hasArticleMeta || hasCitationMeta;
    console.log('最终判断是否为文献页面:', isLiterature);
    
    return isLiterature;
}

// 自动检测并弹出功能
function autoDetectAndPopup() {
    console.log('开始自动检测，当前URL:', window.location.href);
    
    // 检查URL是否发生变化（单页应用场景）
    const newUrl = window.location.href;
    if (newUrl !== currentPageUrl) {
        console.log('检测到页面URL变化，重置弹出状态');
        hasAutoPopped = false;
        currentPageUrl = newUrl;
    }
    
    // 如果已经弹出过，则跳过后续检测
    if (hasAutoPopped) {
        console.log('当前页面已经弹出过，跳过自动检测');
        return;
    }
    
    // 首先检查是否为文献页面
    const isLitPage = isLiteraturePage();
    console.log('是否为文献页面:', isLitPage);
    
    if (!isLitPage) {
        console.log('当前页面不是文献页面，跳过自动检测');
        return;
    }
    
    const journalInfo = detectJournalFromPage();
    console.log('检测到的期刊信息:', journalInfo);
    
    // 如果检测到期刊信息，通知background script弹出插件
    if (journalInfo && journalInfo.journalName) {
        console.log('✅ 检测到文献页面期刊信息:', journalInfo.journalName);
        
        // 标记当前页面已经弹出过
        hasAutoPopped = true;
        console.log('设置弹出状态为已弹出，后续检测将被跳过');
        
        // 发送消息给background script请求弹出
        chrome.runtime.sendMessage({
            action: 'autoPopup',
            journalName: journalInfo.journalName,
            url: window.location.href,
            hostname: window.location.hostname
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('发送消息失败:', chrome.runtime.lastError);
                // 如果发送失败，重置弹出状态，允许重试
                hasAutoPopped = false;
            } else {
                console.log('消息发送成功:', response);
            }
        });
    } else {
        console.log('❌ 文献页面但无法检测到期刊信息');
    }
} 