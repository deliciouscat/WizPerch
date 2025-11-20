# WizPerch
웹 페이지 추천 / 정보탐색 연속성 지원 크롬 익스텐션.
이 레포지토리는 Micro Service Architecture 중 다음을 담당함.
- client(frontend)
- 유저 정보 관리(Clerk + Convex. 템플릿 코드가 이미 작성되어 있으므로 참고할 것.)
- Paddle 결제 모듈

이 레포는 AI Agent workflow를 담당하는 서버와 상호작용 할 것임.
`/Users/deliciouscat/projects/PageLink-retrieve-server`에 해당 코드가 작성되어 있고, 이 코드는 전면적으로 수정될 예정임. 통신되는 JSON 데이터의 규격을 제안하고 허가받을 것.

## 웹 페이지 추천
현재 탭, 다른 열린 탭, 기존 히스토리 기반으로 2~5개 사이의 게시물 추천.
댓글을 통해 유저 간 의견교환도 가능하다.

## 정보탐색 연속성 지원
`내일읽기`: 컴퓨터를 종료하기 전, 지금 켜놓은 탭을 저장해놓을 수 있는 기능.

# 개발 지침
- 세부적인 지시는 `*.pseudoCode.txt`에 작성됨. 
- 지침이 없는 부분을 개발할 때, 주요한 변경사항/제안사항은 허가를 요청할 것.

# 기술스택
외부 툴킷 적극 사용.
- Client: Vue/TypeScript/Vite
- Backend: Convex
- Auth: Clerk
- payment: Paddle

# 디자인 지침
- WikiPedia와 같은 단순한 디자인
- 특별한 지시가 없으면 border radius는 0임
- `color_template.css`로 색상 관리.
