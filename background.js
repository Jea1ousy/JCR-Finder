// 后台服务工作器

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
    console.log('期刊分区查询插件已安装');
    
    // 设置右键菜单
    chrome.contextMenus.create({
        id: 'searchJournalPartition',
        title: '查询期刊分区',
        contexts: ['selection']
    });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'searchJournalPartition') {
        const selectedText = info.selectionText;
        if (selectedText) {
            // 存储选中的文本，供popup使用
            chrome.storage.local.set({
                selectedJournal: selectedText.trim()
            });
            
            // 打开popup（通过点击插件图标）
            chrome.action.openPopup();
        }
    }
});

// 处理来自content script或popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelectedJournal') {
        // 获取存储的选中文本
        chrome.storage.local.get(['selectedJournal'], (result) => {
            sendResponse({ selectedJournal: result.selectedJournal || null });
            // 清除存储的文本
            chrome.storage.local.remove(['selectedJournal']);
        });
        return true; // 表示异步响应
    }
    
    if (request.action === 'searchJournal') {
        // 可以在这里处理更复杂的搜索逻辑
        // 比如调用外部API等
        sendResponse({ success: true });
    }
    
    if (request.action === 'checkApiKey') {
        // 检查API密钥是否配置
        chrome.storage.local.get(['easyscholar_api_key'], (result) => {
            sendResponse({ hasApiKey: !!result.easyscholar_api_key });
        });
        return true;
    }
    
    if (request.action === 'autoPopup') {
        // 处理自动弹出请求
        handleAutoPopup(request, sender);
        sendResponse({ success: true });
    }
    
    if (request.action === 'clearPopupHistory') {
        // 清理弹出历史
        chrome.storage.local.remove(['popupUrls', 'lastPopupUrl'], () => {
            console.log('已清理弹出历史');
            sendResponse({ success: true });
        });
        return true;
    }
    
    if (request.action === 'resetPagePopupStatus') {
        // 重置当前页面的弹出状态（用于调试）
        const currentUrl = request.url;
        if (currentUrl) {
            chrome.storage.local.get(['popupUrls'], (result) => {
                const popupUrls = result.popupUrls || [];
                const updatedUrls = popupUrls.filter(url => url !== currentUrl);
                chrome.storage.local.set({ popupUrls: updatedUrls }, () => {
                    console.log('已重置页面弹出状态:', currentUrl);
                    sendResponse({ success: true });
                });
            });
        } else {
            sendResponse({ success: false, error: 'No URL provided' });
        }
        return true;
    }
});

// 监听标签页更新，可以用于自动检测
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // 检查是否是学术网站
        const academicSites = [
            'nature.com',
            'science.org',
            'ieee.org',
            'acm.org',
            'springer.com',
            'sciencedirect.com',
            'wiley.com',
            'tandfonline.com',
            'plos.org',
            'pubmed.ncbi.nlm.nih.gov'
        ];
        
        const isAcademicSite = academicSites.some(site => tab.url.includes(site));
        
        if (isAcademicSite) {
            // 在学术网站上，可以设置插件图标的徽章
            chrome.action.setBadgeText({
                text: '📚',
                tabId: tabId
            });
            chrome.action.setBadgeBackgroundColor({
                color: '#4CAF50'
            });
        } else {
            // 清除徽章
            chrome.action.setBadgeText({
                text: '',
                tabId: tabId
            });
        }
    }
});

// 处理插件图标点击事件
chrome.action.onClicked.addListener((tab) => {
    // 如果需要特殊处理点击事件可以在这里添加
    console.log('插件图标被点击');
});

// 处理自动弹出请求
async function handleAutoPopup(request, sender) {
    const tabId = sender.tab.id;
    const pageUrl = request.url;
    
    try {
        // 检查是否启用了自动弹出功能
        const settings = await chrome.storage.local.get(['autoPopupEnabled', 'lastAutoPopup', 'lastPopupUrl', 'popupUrls']);
        console.log('当前设置:', settings);
        
        // 初始化已弹出URL列表
        const popupUrls = settings.popupUrls || [];
        
        // 检查当前URL是否已经弹出过
        if (popupUrls.includes(pageUrl)) {
            console.log('当前页面URL已经弹出过，跳过此次弹出:', pageUrl);
            return;
        }
        
        // 默认启用自动弹出，除非用户主动关闭
        if (settings.autoPopupEnabled !== false) {
            // 检查是否在短时间内已经弹出过相同期刊（避免重复弹出）
            const now = Date.now();
            const lastPopup = settings.lastAutoPopup || 0;
            const timeDiff = now - lastPopup;
            const lastUrl = settings.lastPopupUrl || '';
            
            console.log('时间检查:', { now, lastPopup, timeDiff, lastUrl, currentUrl: pageUrl });
            
            // 如果是相同URL且在5分钟内，跳过
            if (lastUrl === pageUrl && timeDiff < 5 * 60 * 1000) {
                console.log('相同页面在5分钟内已弹出过，跳过此次弹出');
                return;
            }
            
            // 记录此次弹出的URL
            popupUrls.push(pageUrl);
            // 只保留最近100个URL，避免存储过多
            if (popupUrls.length > 100) {
                popupUrls.splice(0, popupUrls.length - 100);
            }
            
            // 存储检测到的期刊信息，供popup使用
            await chrome.storage.local.set({
                autoDetectedJournal: request.journalName,
                autoDetectUrl: request.url,
                autoDetectHostname: request.hostname,
                autoDetectTime: now,
                lastAutoPopup: now,
                lastPopupUrl: pageUrl,
                popupUrls: popupUrls
            });
            // console.log('已存储检测到的期刊信息到本地存储');
            // console.log('已记录弹出URL:', pageUrl);
            
            // 设置徽章显示检测状态
            try {
                await chrome.action.setBadgeText({
                    text: '📚',
                    tabId: tabId
                });
                await chrome.action.setBadgeBackgroundColor({
                    color: '#27ae60'
                });
                console.log('已设置插件图标徽章');
            } catch (badgeError) {
                console.error('设置徽章失败:', badgeError);
            }
            
            // 尝试在Edge中弹出插件窗口（虽然通常不被允许）
            try {
                console.log('尝试自动弹出插件窗口...');
                await chrome.action.openPopup();
                console.log('✅ 插件窗口弹出成功！');
            } catch (popupError) {
                console.warn('❌ 自动弹出失败（预期行为）:', popupError.message);
                
                // 显示通知作为替代方案
                try {
                    console.log('尝试显示系统通知...');
                    const notificationId = await chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon.svg',
                        title: '期刊分区检测',
                        message: `检测到期刊: ${request.journalName}\n点击插件图标查看详情`
                    });
                    console.log('✅ 通知创建成功，ID:', notificationId);
                } catch (notificationError) {
                    console.error('❌ 通知创建失败:', notificationError);
                }
            }
            
            // 更明显的徽章提示
            try {
                await chrome.action.setBadgeText({
                    text: '🔍',
                    tabId: tabId
                });
                console.log('已更新徽章为检测标识');
            } catch (badgeError2) {
                console.error('更新徽章失败:', badgeError2);
            }
            
            // console.log(`✅ 自动检测完成 - 期刊: ${request.journalName}`);
        } else {
            console.log('自动弹出功能已被用户禁用');
        }
    } catch (error) {
        console.error('❌ 自动弹出处理失败:', error);
        console.error('错误详情:', error.stack);
    }
} 