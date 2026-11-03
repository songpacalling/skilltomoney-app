import { NextRequest, NextResponse } from "next/server";
import { courses } from "@/data/courses";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, course, name, phone, people } = body;

    // 1. 필수 입력값 검증
    if (!name || !phone || !course) {
      return NextResponse.json(
        { error: "이름, 연락처, 강좌 정보는 필수 항목입니다." },
        { status: 400 }
      );
    }

    // 2. 강좌 데이터 조회 및 서버 측 수강료 계산
    const targetCourse = courses.find(
      (c) => c.name === course || c.id === course
    );

    if (!targetCourse) {
      return NextResponse.json(
        { error: "존재하지 않는 강좌입니다." },
        { status: 404 }
      );
    }

    const count = Math.max(1, Number(people) || 1);
    const remainingSeats = targetCourse.seat - targetCourse.booked;

    if (count > remainingSeats) {
      return NextResponse.json(
        { error: `신청 인원이 남은 자리(${remainingSeats}석)보다 많습니다.` },
        { status: 400 }
      );
    }

    // 결제 금액(total)은 화면이 보낸 값이 아닌, 서버가 강좌 수강료 × 인원으로 계산
    const total = targetCourse.price * count;

    // 3. .env 환경변수에서 SHEET_URL 읽기 (서버 사이드 전용)
    const sheetUrl = process.env.SHEET_URL;
    if (!sheetUrl) {
      console.error("서버 에러: SHEET_URL 환경변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "구글 시트 연동 주소(SHEET_URL)가 서버에 설정되어 있지 않습니다." },
        { status: 500 }
      );
    }

    // 4. 구글 스프레드시트 Apps Script 웹 앱으로 데이터 전송
    const payload = {
      date: date || targetCourse.date,
      course: targetCourse.name,
      name: String(name).trim(),
      phone: String(phone).trim(),
      people: count,
      total,
    };

    const gasResponse = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });

    if (!gasResponse.ok) {
      console.warn("구글 시트 응답 상태 코드:", gasResponse.status);
    }

    return NextResponse.json({
      success: true,
      result: "ok",
      total,
      message: "예약이 정상 접수되었습니다.",
    });
  } catch (error) {
    console.error("예약 API 처리 중 오류 발생:", error);
    return NextResponse.json(
      { error: "서버 처리 중 오류가 발생했습니다. 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
