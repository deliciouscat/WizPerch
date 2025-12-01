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
        const { loginTabId, loginStartTime, loginTabClosed } = await chrome.storage.local.get(['loginTabId', 'loginStartTime', 'loginTabClosed']);

        // 이미 처리된 탭이면 무시
        if (loginTabClosed) {
            return;
        }

        // 이 탭이 로그인 탭인지 확인
        if (loginTabId === tabId && loginStartTime) {
            // Clerk 로그인 완료를 나타내는 URL 패턴 확인
            const url = tab.url.toLowerCase();

            // 로그인 시작 후 최소 5초가 지났는지 확인 (너무 빠른 감지 방지)
            const timeSinceLoginStart = Date.now() - loginStartTime;
            const minWaitTime = 5000;

            // 로그인 페이지 자체는 제외하고, 실제 완료 페이지만 감지
            const isSignInPage = url.includes('/sign-in') || url.includes('/sign-up');
            const isSignInCallback = url.includes('/sign-in/sso-callback') || url.includes('/sign-up/sso-callback');

            // 로그인 완료를 나타내는 명확한 패턴들만 사용
            const loginCompletePatterns = [
                '/sign-in/sso-callback',
                '/sign-up/sso-callback',
                '/user',
                '/dashboard',
                '/verify-email',
                '/verify-phone'
            ];

            // JSON 에러 응답 페이지 감지 (Clerk API 에러 응답)
            // redirect_url 에러가 발생해도 로그인 자체는 완료되었을 수 있음
            const isJsonErrorPage = url.includes('clerk') && (
                url.includes('/v1/') || // Clerk API 엔드포인트
                url.includes('clerk-telemetry') || // Clerk 텔레메트리
                url.includes('invalid_url_scheme') || // redirect_url 에러
                tab.title?.includes('JSON') || // 탭 제목에 JSON 포함
                tab.title?.includes('Error') // 탭 제목에 Error 포함
            );

            // 로그인 완료 페이지인지 확인 (로그인 페이지 자체는 제외)
            const isLoginComplete = url.includes('clerk') &&
                !isSignInPage && // 로그인 페이지 자체는 제외
                (
                    loginCompletePatterns.some(pattern => url.includes(pattern)) ||
                    isSignInCallback // 콜백 페이지는 완료로 간주
                );

            // JSON 에러 페이지도 감지하여 탭 닫기 (로그인 실패 또는 에러 발생)
            if ((isLoginComplete || isJsonErrorPage) && timeSinceLoginStart > minWaitTime) {
                const isError = isJsonErrorPage && !isLoginComplete;
                console.log(isError ? 'JSON 에러 페이지 감지, 탭 닫기' : '로그인 완료 감지, 탭 닫기 및 사이드패널 리다이렉트', {
                    tabId,
                    url: tab.url,
                    timeSinceLoginStart,
                    isSignInPage,
                    isSignInCallback,
                    isJsonErrorPage,
                    isError
                });

                // 중복 처리 방지를 위한 플래그 설정
                await chrome.storage.local.set({ loginTabClosed: true });

                // 로그인 탭 정보 삭제
                await chrome.storage.local.remove(['loginTabId', 'loginStartTime']);

                // 사용자가 로그인 완료를 확인할 수 있도록 충분히 대기 후 탭 닫기
                setTimeout(async () => {
                    try {
                        // 탭이 여전히 존재하는지 확인
                        const currentTab = await chrome.tabs.get(tabId).catch(() => null);
                        if (currentTab) {
                            await chrome.tabs.remove(tabId);
                            console.log('로그인 탭 닫기 완료');
                        }
                    } catch (error) {
                        console.error('로그인 탭 닫기 실패:', error);
                    }
                }, 2000); // 2초 대기로 증가

                // JSON 에러 페이지도 로그인 완료로 간주
                // redirect_url 에러는 발생했지만 로그인 자체는 완료되었을 수 있음
                // 사이드패널에서 사용자 인증 상태를 확인하여 실제 로그인 여부 판단
                await chrome.storage.local.set({
                    loginComplete: true,
                    loginCompleteTime: Date.now(),
                    loginCheckNeeded: isError // 에러인 경우 사이드패널에서 인증 상태 재확인 필요
                });

                if (isError) {
                    console.log('JSON 에러 페이지 감지, 로그인 완료 플래그 설정 (사이드패널에서 인증 상태 확인)');
                } else {
                    console.log('로그인 완료 플래그 설정 완료');
                }
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

