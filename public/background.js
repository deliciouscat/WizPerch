/**
 * WizPerch Chrome Extension Background Service Worker
 * 
 * 이 파일은 확장 프로그램의 백그라운드 작업을 처리합니다.
 * - 사이드 패널 제어
 * - 탭 정보 수집
 * - 키보드 단축키 처리
 */

// 확장 프로그램 아이콘 클릭 시 사이드 패널 열기
chrome.action.onClicked.addListener(async (tab) => {
    try {
        // 사이드 패널 열기
        await chrome.sidePanel.open({ tabId: tab.id });
    } catch (error) {
        console.error('Error opening side panel:', error);
    }
});

// 키보드 단축키 처리
chrome.commands.onCommand.addListener(async (command) => {
    // 사이드 패널 토글 (Alt+W)
    if (command === '_execute_action') {
        try {
            // 현재 활성 탭 가져오기
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
                await chrome.sidePanel.open({ tabId: tab.id });
            }
        } catch (error) {
            console.error('Error opening side panel via command:', error);
        }
        return;
    }

    // 탭 저장 (Alt+S)
    if (command === 'save-tabs') {
        // 현재 창의 모든 탭 가져오기
        const tabs = await chrome.tabs.query({ currentWindow: true });
        
        // 탭 정보 수집
        const tabData = tabs.map(tab => ({
            id: tab.id,
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
        }));

        // 로컬 스토리지에 저장 (또는 Convex로 전송)
        await chrome.storage.local.set({
            savedTabs: {
                date: new Date().toISOString(),
                tabs: tabData
            }
        });

        // 알림 표시 (선택사항)
        chrome.notifications?.create({
            type: 'basic',
            iconUrl: 'assets/icon-48.png',
            title: 'WizPerch',
            message: `${tabData.length}개의 탭이 저장되었습니다.`
        });
    }
});

// 확장 프로그램 설치 시 초기화
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('WizPerch extension installed');
        // 초기 설정 등
    } else if (details.reason === 'update') {
        console.log('WizPerch extension updated');
    }
});

