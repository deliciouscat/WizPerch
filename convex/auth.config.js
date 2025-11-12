/**
 * @fileoverview Convex 인증 구성
 *
 * 이 파일은 Convex가 Clerk와 함께 인증을 처리하는 방법을 구성합니다.
 * Clerk 인증 토큰을 검증하고 프론트엔드와 백엔드 간의 보안 연결을
 * 설정하기 위한 JWT 제공자 구성을 설정합니다.
 *
 * 주요 구성:
 * - Clerk 환경 변수에서 JWT 발급자 도메인
 * - Convex 백엔드 식별을 위한 애플리케이션 ID
 * - 인증된 요청을 위한 보안 토큰 검증
 *
 * 필요한 환경 변수:
 * - CLERK_JWT_ISSUER_DOMAIN: 토큰 검증을 위한 Clerk의 JWT 발급자 도메인
 *
 * @author Vue + Convex + Clerk Auth System
 * @version 1.0.0
 * @see https://docs.convex.dev/auth
 */

export default {
  /**
   * 인증 제공자 구성.
   *
   * 이 배열은 Convex가 수락할 인증 방법을 정의합니다.
   * 현재 Clerk의 JWT 기반 인증 시스템을 사용하도록 구성되어 있습니다.
   */
  providers: [
    {
      /**
       * Clerk 인증을 위한 JWT 발급자 도메인.
       *
       * 이 도메인은 Clerk가 발급한 JWT 토큰을 검증하는 데 사용됩니다.
       * 도메인은 Clerk의 JWT 토큰의 발급자 클레임과 일치해야 합니다.
       */
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,

      /**
       * Convex를 위한 애플리케이션 식별자.
       *
       * 이 ID는 이 Convex 백엔드를 Clerk에 고유하게 식별합니다.
       * Clerk의 JWT 토큰 템플릿 구성에서 사용됩니다.
       */
      applicationID: "convex",
    },
  ],
};
