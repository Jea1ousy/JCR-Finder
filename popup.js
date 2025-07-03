// EasyScholar API 配置
const DEFAULT_API_BASE_URL = 'https://www.easyscholar.cc/open/getPublicationRank';
const DEFAULT_API_KEY = ''; // 默认API密钥（备用）

document.addEventListener('DOMContentLoaded', function() {
    const journalInput = document.getElementById('journalInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultDiv = document.getElementById('result');
    
    // API设置相关元素
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.getElementById('closeModal');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiBaseUrlInput = document.getElementById('apiBaseUrlInput');
    const apiStatus = document.getElementById('apiStatus');
    const testApiBtn = document.getElementById('testApiBtn');
    const saveApiBtn = document.getElementById('saveApiBtn');
    
    // 初始化API设置状态
    initializeApiSettings();
    
    // 检查是否有自动检测到的期刊信息
    chrome.storage.local.get(['autoDetectedJournal', 'autoDetectTime'], (result) => {
        if (result.autoDetectedJournal && result.autoDetectTime) {
            // 检查自动检测的时间是否在最近5分钟内
            const timeDiff = Date.now() - result.autoDetectTime;
            if (timeDiff < 5 * 60 * 1000) { // 5分钟内
                journalInput.value = result.autoDetectedJournal;
                showAutoDetected(result.autoDetectedJournal);
                searchJournal(result.autoDetectedJournal);
                
                // 清除自动检测数据
                chrome.storage.local.remove(['autoDetectedJournal', 'autoDetectTime']);
                return;
            }
        }
        
        // 检查是否有选中的文本（来自右键菜单）
        chrome.runtime.sendMessage({ action: 'getSelectedJournal' }, (response) => {
            if (response && response.selectedJournal) {
                journalInput.value = response.selectedJournal;
                searchJournal(response.selectedJournal);
            } else {
                // 手动检测当前页面的期刊信息
                detectCurrentPageJournal();
            }
        });
    });
    
    // 搜索按钮点击事件
    searchBtn.addEventListener('click', function() {
        const journalName = journalInput.value.trim();
        if (journalName) {
            searchJournal(journalName);
        }
    });
    
    // 回车键搜索
    journalInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const journalName = journalInput.value.trim();
            if (journalName) {
                searchJournal(journalName);
            }
        }
    });
    
    // 自动弹出开关事件
    const autoPopupToggle = document.getElementById('autoPopupToggle');
    
    // 加载自动弹出设置
    chrome.storage.local.get(['autoPopupEnabled'], (result) => {
        autoPopupToggle.checked = result.autoPopupEnabled !== false; // 默认启用
    });
    
    // 监听开关变化
    autoPopupToggle.addEventListener('change', function() {
        chrome.storage.local.set({ autoPopupEnabled: this.checked });
        if (this.checked) {
            showNotification('已启用自动弹出检测', 'success');
        } else {
            showNotification('已关闭自动弹出检测', 'info');
        }
    });
    
    // API设置事件绑定
    settingsBtn.addEventListener('click', function() {
        openSettingsModal();
    });
    
    closeModal.addEventListener('click', function() {
        closeSettingsModal();
    });
    
    // 点击模态窗口外部关闭
    settingsModal.addEventListener('click', function(e) {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });
    
    // ESC键关闭模态窗口
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && settingsModal.style.display === 'flex') {
            closeSettingsModal();
        }
    });
    
    // 测试API连接
    testApiBtn.addEventListener('click', function() {
        testApiConnection();
    });
    
    // 保存API设置
    saveApiBtn.addEventListener('click', function() {
        saveApiSettings();
    });
});

// 检测当前页面的期刊信息
async function detectCurrentPageJournal() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // 向content script发送消息获取页面信息
        chrome.tabs.sendMessage(tab.id, { action: 'detectJournal' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('无法检测页面信息:', chrome.runtime.lastError);
                showNoAutoDetection();
                return;
            }
            
            if (response && response.journalName) {
                document.getElementById('journalInput').value = response.journalName;
                showAutoDetected(response.journalName);
                searchJournal(response.journalName);
            } else {
                showNoAutoDetection();
            }
        });
    } catch (error) {
        console.error('检测失败:', error);
        showNoAutoDetection();
    }
}

// 显示自动检测到的期刊
function showAutoDetected(journalName) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="auto-detect">🚀 自动检测并弹出</div>
        <div class="loading">正在查询 "${journalName}" 的分区信息...</div>
    `;
}

// 显示无法自动检测
function showNoAutoDetection() {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="no-result">
            💡 无法自动检测当前页面期刊信息<br>
            请手动输入期刊名称进行查询
        </div>
    `;
}

// 搜索期刊分区信息
async function searchJournal(journalName) {
    const resultDiv = document.getElementById('result');
    
    // 显示加载状态
    resultDiv.innerHTML = `<div class="loading">正在查询 "${journalName}" 的分区信息...</div>`;
    
    try {
        // 获取用户配置的API设置
        const apiConfig = await getApiConfig();
        
        // 调用EasyScholar API
        const result = await queryEasyScholarAPI(journalName, apiConfig.apiKey, apiConfig.apiUrl);
        
        if (result && result.code === 200) {
            displayJournalInfo(journalName, result.data);
        } else {
            // 如果使用的是默认API密钥且查询失败，提示用户配置自己的API
            if (apiConfig.apiKey === DEFAULT_API_KEY && result && result.code !== 200) {
                displayApiKeyRequired(result.msg || '查询失败');
            } else {
                displayApiError(result ? result.msg : '查询失败');
            }
        }
    } catch (error) {
        console.error('API查询错误:', error);
        
        // 获取API配置判断是否使用默认密钥
        const apiConfig = await getApiConfig();
        if (apiConfig.apiKey === DEFAULT_API_KEY) {
            displayApiKeyRequired('网络连接失败或API密钥无效');
        } else {
            displayError('网络连接失败，请检查网络设置');
        }
    }
}

// 获取API配置
function getApiConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['easyscholar_api_key', 'easyscholar_api_url'], (result) => {
            resolve({
                apiKey: result.easyscholar_api_key || DEFAULT_API_KEY,
                apiUrl: result.easyscholar_api_url || DEFAULT_API_BASE_URL
            });
        });
    });
}

// 调用EasyScholar API
async function queryEasyScholarAPI(journalName, apiKey, apiUrl = DEFAULT_API_BASE_URL) {
    const url = `${apiUrl}?secretKey=${apiKey}&publicationName=${encodeURIComponent(journalName)}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
}

// 显示期刊信息
function displayJournalInfo(journalName, apiData) {
    const resultDiv = document.getElementById('result');
    
    if (!apiData || !apiData.officialRank) {
        displayNoResult(journalName);
        return;
    }
    
    const rankData = apiData.officialRank.select || apiData.officialRank.all;
    
    let htmlContent = `<div class="journal-info">
        <div class="journal-title">${journalName}</div>`;
    
    // 中科院分区 (sci)
    if (rankData.sci) {
        const partitionClass = getPartitionClass(rankData.sci);
        htmlContent += `
            <div class="partition-info">
                <span class="partition-label ${partitionClass}">${rankData.sci}</span>
                <span class="partition-value">中科院分区</span>
            </div>`;
    } 
    
    // CCF分区
    if (rankData.ccf) {
        const ccfClass = getCCFPartitionClass(rankData.ccf);
        htmlContent += `
            <div class="partition-info">
                <span class="partition-label ${ccfClass}">${rankData.ccf}</span>
                <span class="partition-value">CCF分区</span>
            </div>`;
    }

    // 中科院基础版分区 (sciBase)
    if (rankData.sciBase) {
        htmlContent += `
            <div class="partition-info">
                <span class="partition-label">${rankData.sciBase}</span>
                <span class="partition-value">中科院基础版</span>
            </div>`;
    }
    
    // 中科院升级版分区 (sciUp)
    if (rankData.sciUp) {
        htmlContent += `
            <div class="partition-info">
                <span class="partition-label">${rankData.sciUp}</span>
                <span class="partition-value">中科院升级版</span>
            </div>`;
    }
    
    // 影响因子 (sciif)
    if (rankData.sciif) {
        htmlContent += `
            <div class="partition-info">
                <span class="partition-label">IF: ${rankData.sciif}</span>
                <span class="partition-value">影响因子</span>
            </div>`;
    }
    
    // JCI指数
    if (rankData.jci) {
        htmlContent += `
            <div class="partition-info">
                <span class="partition-label">JCI: ${rankData.jci}</span>
                <span class="partition-value">期刊引证指标</span>
            </div>`;
    }
    
    // EI收录
    if (rankData.eii) {
        htmlContent += `
            <div class="partition-info">
                <span class="partition-label">${rankData.eii}</span>
                <span class="partition-value">EI收录</span>
            </div>`;
    }
    
    // ESI学科
    if (rankData.esi) {
        htmlContent += `
            <div class="partition-info">
                <span class="partition-label">${rankData.esi}</span>
                <span class="partition-value">ESI学科</span>
            </div>`;
    }
    
    // 各校分级
    // const schoolRanks = [];
    // if (rankData.swufe) schoolRanks.push(`西南财经大学: ${rankData.swufe}`);
    // if (rankData.swjtu) schoolRanks.push(`西南交通大学: ${rankData.swjtu}`);
    // if (rankData.hhu) schoolRanks.push(`河海大学: ${rankData.hhu}`);
    // if (rankData.xju) schoolRanks.push(`新疆大学: ${rankData.xju}`);
    // if (rankData.cug) schoolRanks.push(`中国地质大学: ${rankData.cug}`);
    // if (rankData.scu) schoolRanks.push(`四川大学: ${rankData.scu}`);
    
    // if (schoolRanks.length > 0) {
    //     htmlContent += `
    //         <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
    //             <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">各校分级</div>
    //             <div style="font-size: 12px; color: #666;">
    //                 ${schoolRanks.join('<br>')}
    //             </div>
    //         </div>`;
    // }
    
    htmlContent += '</div>';
    resultDiv.innerHTML = htmlContent;
}

// 获取分区对应的CSS类
function getPartitionClass(partition) {
    if (partition.includes('Q1') || partition.includes('1区')) return 'partition-q1';
    if (partition.includes('Q2') || partition.includes('2区')) return 'partition-q2';
    if (partition.includes('Q3') || partition.includes('3区')) return 'partition-q3';
    if (partition.includes('Q4') || partition.includes('4区')) return 'partition-q4';
    return '';
}

// 获取CCF分区对应的CSS类
function getCCFPartitionClass(ccfRank) {
    const rank = ccfRank.toUpperCase();
    if (rank.includes('A') || rank === 'CCF-A') return 'partition-ccf-a';
    if (rank.includes('B') || rank === 'CCF-B') return 'partition-ccf-b';
    if (rank.includes('C') || rank === 'CCF-C') return 'partition-ccf-c';
    return 'partition-ccf-other';
}

// 显示未找到结果
function displayNoResult(journalName) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="no-result">
            ❌ 未找到期刊 "${journalName}" 的分区信息<br><br>
            💡 建议：<br>
            • 检查期刊名称拼写<br>
            • 尝试使用期刊全称或简称<br>
            • 使用英文期刊名<br>
            • 检查API密钥是否正确
        </div>
    `;
}

// 显示API错误
function displayApiError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="error">
            ❌ API查询失败: ${message}<br><br>
            可能的原因：<br>
            • API密钥无效或已过期<br>
            • 查询次数已用完<br>
            • 期刊名称不在数据库中<br>
            • 网络连接问题
        </div>
    `;
}

// 显示API密钥缺失
function displayApiKeyRequired(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="error">
            ❌ API密钥缺失: ${message}<br><br>
            可能的原因：<br>
            • 请配置自己的API密钥<br>
            • 检查API密钥是否正确
        </div>
    `;
}

// 处理错误
function displayError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<div class="error">❌ ${message}</div>`;
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// 初始化API设置状态
function initializeApiSettings() {
    chrome.storage.local.get(['easyscholar_api_key', 'easyscholar_api_url'], (result) => {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiBaseUrlInput = document.getElementById('apiBaseUrlInput');
        const apiStatus = document.getElementById('apiStatus');
        const settingsBtn = document.getElementById('settingsBtn');
        
        // 加载保存的API密钥
        if (result.easyscholar_api_key) {
            apiKeyInput.value = result.easyscholar_api_key;
            apiStatus.textContent = '已配置';
            apiStatus.className = 'api-status configured';
            
            // 移除设置按钮的提示标记
            settingsBtn.textContent = '⚙️';
            settingsBtn.title = 'API设置';
        } else {
            apiStatus.textContent = '未配置';
            apiStatus.className = 'api-status not-configured';
            
            // 在设置按钮上添加提示标记
            settingsBtn.textContent = '⚠️';
            settingsBtn.title = 'API设置 - 需要配置API密钥';
        }
        
        // 加载保存的API URL
        if (result.easyscholar_api_url) {
            apiBaseUrlInput.value = result.easyscholar_api_url;
        } else {
            apiBaseUrlInput.value = DEFAULT_API_BASE_URL;
        }
    });
}

// 打开设置模态窗口
function openSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    settingsModal.style.display = 'flex';
    
    // 重新加载当前设置
    initializeApiSettings();
}

// 关闭设置模态窗口
function closeSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    settingsModal.style.display = 'none';
}

// 测试API连接
async function testApiConnection() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiBaseUrlInput = document.getElementById('apiBaseUrlInput');
    const testApiBtn = document.getElementById('testApiBtn');
    
    const apiKey = apiKeyInput.value.trim();
    const apiUrl = apiBaseUrlInput.value.trim();
    
    if (!apiKey) {
        showNotification('请先输入API密钥', 'error');
        return;
    }
    
    if (!apiUrl) {
        showNotification('请输入API基础URL', 'error');
        return;
    }
    
    // 更新按钮状态
    const originalText = testApiBtn.textContent;
    testApiBtn.textContent = '测试中...';
    testApiBtn.disabled = true;
    
    try {
        // 使用一个常见的期刊名称进行测试
        const testJournal = 'Nature';
        const testUrl = `${apiUrl}?secretKey=${apiKey}&publicationName=${encodeURIComponent(testJournal)}`;
        
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10秒超时
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && (data.code === 200 || data.data)) {
            showNotification('API连接测试成功！', 'success');
        } else {
            showNotification(`API返回错误: ${data.msg || '未知错误'}`, 'error');
        }
        
    } catch (error) {
        console.error('API测试失败:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showNotification('网络连接失败，请检查API URL和网络设置', 'error');
        } else {
            showNotification(`API测试失败: ${error.message}`, 'error');
        }
    } finally {
        // 恢复按钮状态
        testApiBtn.textContent = originalText;
        testApiBtn.disabled = false;
    }
}

// 保存API设置
function saveApiSettings() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiBaseUrlInput = document.getElementById('apiBaseUrlInput');
    const apiStatus = document.getElementById('apiStatus');
    const settingsBtn = document.getElementById('settingsBtn');
    
    const apiKey = apiKeyInput.value.trim();
    const apiUrl = apiBaseUrlInput.value.trim() || DEFAULT_API_BASE_URL;
    
    if (!apiKey) {
        showNotification('请输入API密钥', 'error');
        return;
    }
    
    // 验证URL格式
    try {
        new URL(apiUrl);
    } catch (error) {
        showNotification('请输入有效的API URL', 'error');
        return;
    }
    
    // 保存到storage
    chrome.storage.local.set({
        easyscholar_api_key: apiKey,
        easyscholar_api_url: apiUrl
    }, () => {
        // 更新状态显示
        apiStatus.textContent = '已配置';
        apiStatus.className = 'api-status configured';
        
        // 更新设置按钮状态
        settingsBtn.textContent = '⚙️';
        settingsBtn.title = 'API设置';
        
        showNotification('API设置已保存', 'success');
        
        // 延迟关闭模态窗口
        setTimeout(() => {
            closeSettingsModal();
        }, 1000);
    });
} 