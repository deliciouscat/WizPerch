/**
 * WizPerch Chrome Extension Background Service Worker
 * 
 * 이 파일은 확장 프로그램의 백그라운드 작업을 처리합니다.
 * - 사이드 패널 제어
 * - 탭 정보 수집
 * - 키보드 단축키 처리
 * - 로그인 완료 감지 및 처리
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

// 로그인 완료 감지 및 처리
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // 탭이 완전히 로드되었고, 로그인 탭인지 확인
    if (changeInfo.status === 'complete' && tab.url) {
        const { loginTabId, loginStartTime } = await chrome.storage.local.get(['loginTabId', 'loginStartTime']);

        // 이 탭이 로그인 탭인지 확인
        if (loginTabId === tabId && loginStartTime) {
            // Clerk 로그인 완료를 나타내는 URL 패턴 확인
            const url = tab.url.toLowerCase();

            // Clerk 로그인 완료 페이지 패턴들
            const loginCompletePatterns = [
                '/sign-in/sso-callback',
                '/sign-up/sso-callback',
                '/user',
                '/dashboard',
                '/verify',
                '/continue'
            ];

            // 로그인 완료 페이지인지 확인
            const isLoginComplete = url.includes('clerk') && (
                loginCompletePatterns.some(pattern => url.includes(pattern)) ||
                // 또는 sign-in 페이지가 아닌 다른 Clerk 페이지
                (url.includes('clerk') && !url.includes('/sign-in') && !url.includes('/sign-up'))
            );

            // 로그인 시작 후 최소 3초가 지났는지 확인 (너무 빠른 감지 방지)
            const timeSinceLoginStart = Date.now() - loginStartTime;
            const minWaitTime = 3000;

            if (isLoginComplete && timeSinceLoginStart > minWaitTime) {
                console.log('로그인 완료 감지, 탭 닫기 및 사이드패널 리다이렉트', {
                    tabId,
                    url: tab.url,
                    timeSinceLoginStart
                });

                // 로그인 탭 정보 삭제
                await chrome.storage.local.remove(['loginTabId', 'loginStartTime']);

                // 잠시 대기 후 탭 닫기 (사용자가 결과를 볼 수 있도록)
                setTimeout(async () => {
                    try {
                        await chrome.tabs.remove(tabId);
                        console.log('로그인 탭 닫기 완료');
                    } catch (error) {
                        console.error('로그인 탭 닫기 실패:', error);
                    }
                }, 1000);

                // storage 이벤트를 통해 사이드패널에 알림
                await chrome.storage.local.set({
                    loginComplete: true,
                    loginCompleteTime: Date.now()
                });

                console.log('로그인 완료 플래그 설정 완료');
            }
        }
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

