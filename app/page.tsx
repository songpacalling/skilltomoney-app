"use client";

import { use, useState } from "react";
import { courses as initialCoursesData } from "@/data/courses";

export interface Course {
  id: string;
  name: string;
  price: number;
  seat: number;
  booked: number;
  date: string;
  tags: string[];
  icon?: string;
  duration?: string;
  description?: string;
  features?: string[];
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 필터 상태를 URL(?available=1)에서 읽어 서버 렌더링 단계에서부터 필터링된 화면을 보냄.
  // → 브라우저에서 JS가 실행되지 않는 환경에서도 필터가 동작함.
  const initialOnlyAvailable = use(searchParams).available === "1";

  const [courses, setCourses] = useState<Course[]>(initialCoursesData);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [reservedCourse, setReservedCourse] = useState<Course | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(initialOnlyAvailable);

  const toggleOnlyAvailable = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const next = !onlyAvailable;
    setOnlyAvailable(next);
    window.history.replaceState(null, "", next ? "/?available=1#courses" : "/#courses");
  };

  const filteredCourses = onlyAvailable
    ? courses.filter(
        (course) => (Number(course.seat) || 0) - (Number(course.booked) || 0) > 0
      )
    : courses;

  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantPeople, setApplicantPeople] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleBooking = (course: Course) => {
    if (course.seat - course.booked <= 0) return;
    setSelectedCourse(course);
    setApplicantName("");
    setApplicantPhone("");
    setApplicantPeople(1);
    setFormError("");
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const remaining = selectedCourse.seat - selectedCourse.booked;

    // 1. 이름 검증
    if (!applicantName.trim()) {
      setFormError("이름을 입력해 주세요.");
      return;
    }

    // 2. 인원 검증 (남은 자리보다 많은 경우)
    if (applicantPeople <= 0) {
      setFormError("신청 인원은 최소 1명 이상이어야 합니다.");
      return;
    }

    if (applicantPeople > remaining) {
      setFormError(
        `신청 인원(${applicantPeople}명)이 남은 자리(${remaining}석)보다 많습니다. 인원을 다시 확인해 주세요.`
      );
      return;
    }

    // 3. 연락처 검증
    if (!applicantPhone.trim()) {
      setFormError("연락처를 입력해 주세요.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      // 구글 시트 주소는 노출하지 않고, Next.js 서버 API(/api/reserve)로만 전송
      // total(결제 금액) 역시 클라이언트가 아닌 서버가 수강료 × 인원으로 계산
      const response = await fetch("/api/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedCourse.date,
          course: selectedCourse.name,
          name: applicantName.trim(),
          phone: applicantPhone.trim(),
          people: applicantPeople,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "예약 처리에 실패했습니다.");
      }

      // 강좌 예약 인원(booked) 증가 반영
      setCourses((prev) =>
        prev.map((c) =>
          c.id === selectedCourse.id
            ? { ...c, booked: Math.min(c.seat, c.booked + applicantPeople) }
            : c
        )
      );

      setReservedCourse(selectedCourse);
      setSelectedCourse(null);
    } catch (error: unknown) {
      console.error("예약 전송 오류:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "예약 신청 중 문제가 발생했습니다. 다시 시도해 주세요.";
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070e24] text-white flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* Background ambient decorative glow (Navy & Gold ambiance) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-amber-500/10 blur-[140px] rounded-full" />
        <div className="absolute top-[30%] right-[-10%] w-[450px] h-[450px] bg-blue-600/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-10 left-[-10%] w-[500px] h-[380px] bg-amber-600/10 blur-[140px] rounded-full" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 w-full border-b border-amber-500/15 bg-[#070e24]/85 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-md shadow-amber-500/20 text-sm">
              ⚡
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                스킬투머니
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  원데이 클래스
                </span>
              </span>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-300 font-medium hidden sm:block">
            배운 기술이 돈이 되는 실전 강좌
          </div>

          <a
            href="#courses"
            className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-full transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            강좌 목록 보기
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-10 sm:pb-14 text-center flex flex-col items-center">
          {/* Gold Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-semibold mb-5 backdrop-blur-sm shadow-inner">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            2026 실전 수익화 커리큘럼 오픈
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
            스킬투머니 <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-400 bg-clip-text text-transparent">강좌 목록</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-2xl font-bold text-amber-100/90 mb-4 leading-relaxed">
            배운 기술이 돈이 되는 원데이 클래스
          </p>

          <p className="max-w-2xl text-slate-300 text-sm sm:text-base leading-relaxed px-2">
            단 하루 3시간 집중 실습으로 바로 외주 수주와 수익 창출까지 이어집니다.
            원하는 강좌를 선택하고 지금 바로 예약을 완료하세요.
          </p>
        </section>

        {/* Course Cards Grid */}
        <section id="courses" className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          {/* Filter Bar (예약 가능한 강좌 필터 버튼) */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6 px-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-slate-300 font-medium">
                전체 강좌 중 <strong className="text-amber-400 font-bold">{filteredCourses.length}</strong>개 표시
              </span>
              {onlyAvailable && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full animate-in fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  예약 가능 강좌만 보기 적용 중 ({courses.length - filteredCourses.length}개 마감 강좌 제외)
                </span>
              )}
            </div>

            <a
              href={onlyAvailable ? "/#courses" : "/?available=1#courses"}
              role="button"
              id="filter-available-btn"
              onClick={toggleOnlyAvailable}
              aria-pressed={onlyAvailable}
              className={`inline-flex items-center gap-2.5 cursor-pointer select-none px-4 py-2 rounded-xl border transition-all duration-200 shadow-md group active:scale-95 ${
                onlyAvailable
                  ? "bg-amber-500/15 border-amber-400 text-amber-300 shadow-amber-500/20"
                  : "bg-[#0c1635] border-amber-500/30 hover:border-amber-400/60 text-slate-300 hover:text-amber-200"
              }`}
            >
              {/* 커스텀 체크박스 (다크모드에서도 명확하게 구분되는 직관적인 UI) */}
              <span
                className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                  onlyAvailable
                    ? "bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 shadow-sm shadow-amber-500/30"
                    : "bg-[#070e24] border border-amber-500/40 group-hover:border-amber-400"
                }`}
              >
                {onlyAvailable && (
                  <svg
                    className="w-3 h-3 stroke-slate-950 stroke-[3]"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </span>
              <span className="text-xs sm:text-sm font-bold">
                예약 가능한 강좌만 보기
              </span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course) => {
              const remaining = course.seat - course.booked;
              const isFull = remaining <= 0;

              return (
                <div
                  key={course.id}
                  className="group relative flex flex-col justify-between rounded-2xl bg-[#0d1633]/90 border border-amber-500/25 p-5 sm:p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/15"
                >
                  {/* Decorative top accent glow on card */}
                  <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div>
                    {/* Card Header (Icon & Date) */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {course.icon || "💡"}
                      </div>
                      <span className="text-xs font-medium text-amber-200/90 bg-[#070e24] px-2.5 py-1 rounded-full border border-amber-500/20">
                        🗓 {course.date}
                      </span>
                    </div>

                    {/* Course Title */}
                    <h2 className="text-xl font-extrabold text-white mb-2 group-hover:text-amber-300 transition-colors">
                      {course.name}
                    </h2>

                    {/* Tags Badges (강좌 이름 아래 작은 배지) */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {course.tags?.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 shadow-sm shadow-amber-500/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-3">
                      <span>⏱ {course.duration || "3시간 완성"}</span>
                      <span>•</span>
                      <span className="text-amber-300/80">실전 집중 코칭</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4 line-clamp-3">
                      {course.description}
                    </p>

                    {/* Seat status box (남은 좌석 ○석 / 정원 ○명) */}
                    <div className="mb-4 p-3 rounded-xl bg-[#081028]/80 border border-amber-500/20">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-amber-200">
                          남은 좌석 {remaining}석 / 정원 {course.seat}명
                        </span>
                        {remaining <= 0 ? (
                          <span className="text-[11px] font-bold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded-full border border-slate-700">
                            마감
                          </span>
                        ) : remaining <= 2 ? (
                          <span className="text-[11px] font-extrabold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/40 shadow-sm shadow-red-500/20 animate-pulse">
                            마감 임박
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            예약 가능
                          </span>
                        )}
                      </div>
                      {/* Capacity progress bar */}
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            remaining <= 0
                              ? "bg-slate-600"
                              : remaining <= 2
                              ? "bg-red-500 shadow-sm shadow-red-500/50"
                              : "bg-gradient-to-r from-amber-500 to-amber-300"
                          }`}
                          style={{
                            width: `${Math.min(100, (course.booked / course.seat) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-1.5 mb-5 pt-3 border-t border-slate-800 text-xs text-slate-300">
                      {course.features?.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Price and Booking Button */}
                  <div className="pt-4 border-t border-amber-500/20">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-400">수강료</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-amber-400 tracking-tight">
                          {course.price.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-white">원</span>
                      </div>
                    </div>

                    {/* Booking Button */}
                    <button
                      onClick={() => handleBooking(course)}
                      disabled={isFull}
                      className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                        isFull
                          ? "bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                          : "text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 group-hover:shadow-amber-400/40 active:scale-[0.98] cursor-pointer"
                      }`}
                    >
                      {isFull ? "예약 마감" : "예약하기"}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredCourses.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-2xl bg-[#0d1633]/50 border border-amber-500/20 p-8">
                <span className="text-4xl mb-3 block">🔍</span>
                <h3 className="text-lg font-bold text-white mb-2">
                  예약 가능한 강좌가 없습니다
                </h3>
                <p className="text-sm text-slate-400 mb-5">
                  현재 모든 강좌가 마감되었거나 조건에 맞는 강좌를 찾을 수 없습니다.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOnlyAvailable(false);
                    window.history.replaceState(null, "", "/#courses");
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  전체 강좌 다시 보기
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Benefits banner (Navy & Gold) */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="rounded-2xl bg-gradient-to-r from-[#0c1635] via-[#101d46] to-[#0c1635] border border-amber-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="text-center md:text-left">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                ✨ 모든 클래스 공통 제공 혜택
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                실전 템플릿 패키지 + 1:1 질문방 평생 이용권 + 수강생 전용 수익화 가이드북 증정
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <p className="text-xs text-amber-300">선착순 마감</p>
                <p className="text-base font-extrabold text-white">소수 정예 밀착 코칭</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Booking Application Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0c1633] border-2 border-amber-400/60 p-6 sm:p-7 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedCourse.icon || "💡"}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  예약 신청
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer text-sm"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-1">
              {selectedCourse.name}
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedCourse.tags?.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400 mb-5">
              예약 정보를 확인하시고 신청자 정보를 입력해 주세요.
            </p>

            {/* Application Form */}
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 mb-6">
              {/* 강좌 이름 (자동 채움) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  강좌 이름
                </label>
                <input
                  type="text"
                  value={selectedCourse.name}
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e24] border border-slate-700/80 text-amber-200 text-sm font-semibold cursor-not-allowed focus:outline-none"
                />
              </div>

              {/* 강의 날짜 (자동 채움) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  날짜
                </label>
                <input
                  type="text"
                  value={selectedCourse.date}
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e24] border border-slate-700/80 text-amber-200 text-sm font-semibold cursor-not-allowed focus:outline-none"
                />
              </div>

              {/* 이름 입력 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  이름 <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="신청자 성함을 입력해 주세요"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e24] border border-amber-500/30 focus:border-amber-400 text-white placeholder-slate-500 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* 연락처 입력 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  연락처 <span className="text-amber-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010-1234-5678"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e24] border border-amber-500/30 focus:border-amber-400 text-white placeholder-slate-500 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* 인원(숫자) 입력 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    인원(숫자) <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[11px] text-amber-300 font-medium">
                    남은 좌석: {selectedCourse.seat - selectedCourse.booked}석
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, selectedCourse.seat - selectedCourse.booked)}
                  value={applicantPeople}
                  onChange={(e) =>
                    setApplicantPeople(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070e24] border border-amber-500/30 focus:border-amber-400 text-white text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* 안내 문구 (이름 누락 또는 잔여 좌석 초과 등 오류 시) */}
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* 금액 및 좌석 요약 */}
              <div className="p-3.5 rounded-xl bg-[#070e24] border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  결제 예정 금액 (1인당 {selectedCourse.price.toLocaleString()}원)
                </span>
                <span className="text-base font-extrabold text-amber-400">
                  {(selectedCourse.price * applicantPeople).toLocaleString()}원
                </span>
              </div>
            </form>

            {/* Buttons: [닫기] and [신청] */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/30 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-75 disabled:cursor-wait"
              >
                {isSubmitting ? "저장 중..." : "신청"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {reservedCourse && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl bg-[#0c1633] border-2 border-emerald-400 p-4 shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom">
          <div className="text-2xl">🎉</div>
          <div className="flex-1">
            <h4 className="text-sm font-extrabold text-emerald-300">
              예약 신청이 완료되었습니다
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              [{reservedCourse.name}] {reservedCourse.date}
              <br />
              구글 시트에 정상 접수되었습니다. 곧 안내 문자가 발송됩니다.
            </p>
          </div>
          <button
            onClick={() => setReservedCourse(null)}
            className="text-slate-400 hover:text-white text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-amber-500/15 bg-[#050a1a] py-8 text-center text-xs sm:text-sm text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400">스킬투머니</span>
            <span>|</span>
            <span>배운 기술이 돈이 되는 원데이 클래스</span>
          </div>
          <p>© 2026 SkillToMoney. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
