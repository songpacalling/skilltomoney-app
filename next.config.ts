import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 개발 서버는 기본적으로 localhost만 허용함.
  // 127.0.0.1 이나 내부망 IP로 접속하면 JS가 차단되어 화면은 보이지만 버튼이 동작하지 않음.
  allowedDevOrigins: ["127.0.0.1", "10.124.229.87"],
};

export default nextConfig;
