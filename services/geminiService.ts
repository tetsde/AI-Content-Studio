import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, ImageAnalysisResult, VideoAnalysisResult, SocialContentResult } from '../types';

// Helper to convert file to base64 string
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // result is a data URL (e.g., "data:video/mp4;base64,...."), we only need the base64 part
            const result = (reader.result as string).split(',')[1];
            if (!result) {
              reject(new Error("Không thể đọc tệp dưới dạng base64."));
              return;
            }
            resolve(result);
        };
        reader.onerror = (error) => reject(error);
    });
};

const getApiKey = (): string => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Không tìm thấy API key. Vui lòng đặt biến môi trường API_KEY.");
    }
    return apiKey;
}

const handleApiError = (error: unknown): Error => {
    console.error("Lỗi API:", error);
    if (error instanceof Error) {
        if (error.message.includes('deadline')) {
             return new Error("Quá trình phân tích mất quá nhiều thời gian. Vui lòng thử lại với tệp nhỏ hơn.");
        }
        if (error.message.includes('size')) {
            return new Error("Tệp quá lớn. Vui lòng thử với tệp nhỏ hơn.");
        }
         return new Error(`Lỗi từ Gemini API: ${error.message}`);
    }
    return new Error("Đã xảy ra lỗi không xác định trong khi phân tích.");
}


export const analyzeVideo = async (videoBase64: string, mimeType: string): Promise<VideoAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const prompt = `
Bạn là một chuyên gia phân tích nội dung phương tiện cho IRIS English, một trung tâm tiếng Anh nổi tiếng tại Đà Nẵng. IRIS English hoạt động theo triết lý cốt lõi là **THỰC HÀNH**, giúp học viên học tiếng Anh bằng cách trải nghiệm thực tế, năng động và hiệu quả.

Video này thuộc về IRIS English và mục tiêu là cung cấp trải nghiệm học tập trực quan, sinh động, hấp dẫn cho học viên. 

Nhiệm vụ của bạn là thực hiện hai hành động:
1. Ghi lại tất cả âm thanh được nói trong video thành văn bản (transcript). Nếu không có lời thoại, hãy viết "Không có lời thoại.". Chú ý giọng điệu, từ khóa liên quan đến học tập, giáo dục, và đặc biệt là cách học **THỰC HÀNH**.
2. Tạo một bản tóm tắt ngắn gọn 3–5 câu bằng tiếng Việt. Bản tóm tắt nên mô tả chủ đề chính, các hoạt động học tập, cách truyền tải kiến thức, tông điệu chung (năng động, thân thiện, chuyên nghiệp), và nhấn mạnh triết lý **THỰC HÀNH** của IRIS English.

Cung cấp đầu ra dưới dạng **đối tượng JSON hợp lệ duy nhất** với hai khóa: "transcript" và "description". Không bao gồm bất kỳ văn bản hay định dạng markdown nào khác ngoài JSON.
`;


    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }, { inlineData: { data: videoBase64, mimeType } }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transcript: {
                            type: Type.STRING,
                            description: "Bản ghi đầy đủ của tất cả lời nói trong video."
                        },
                        description: {
                            type: Type.STRING,
                            description: "Một bản tóm tắt từ 3-5 câu bằng tiếng Việt về nội dung, chủ đề và tông điệu của video."
                        }
                    },
                    required: ["transcript", "description"]
                }
            }
        });

        const jsonString = response.text;
        const result: Omit<VideoAnalysisResult, 'type'> = JSON.parse(jsonString);
        return { ...result, type: 'video' };

    } catch (error) {
        throw handleApiError(error);
    }
};

export const analyzeImage = async (imageBase64: string, mimeType: string): Promise<ImageAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
   const prompt = `
Bạn là một chuyên gia phân tích hình ảnh cho IRIS English, một trung tâm tiếng Anh nổi tiếng tại Đà Nẵng. IRIS English hoạt động theo triết lý cốt lõi là **THỰC HÀNH**, giúp học viên học tiếng Anh qua trải nghiệm thực tế, năng động và hiệu quả.

Hình ảnh này liên quan đến IRIS English, ví dụ như hoạt động học tập, quảng cáo khóa học, hoặc trải nghiệm học viên.

Nhiệm vụ của bạn là thực hiện hai hành động:
1. Mô tả hình ảnh chi tiết bằng 3–5 câu tiếng Việt. Mô tả nên bao gồm chủ thể chính, bối cảnh, màu sắc, tâm trạng tổng thể, phong cách giáo dục, và nhấn mạnh triết lý **THỰC HÀNH** của IRIS English.
2. Trích xuất tất cả văn bản có thể nhìn thấy từ hình ảnh. Nếu không có văn bản, hãy viết "Không có văn bản.".

Cung cấp đầu ra dưới dạng **đối tượng JSON hợp lệ duy nhất** với hai khóa: "description" và "textInImage". Không bao gồm bất kỳ văn bản hay định dạng markdown nào khác ngoài JSON.
`;


    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }, { inlineData: { data: imageBase64, mimeType } }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: {
                            type: Type.STRING,
                            description: "Một mô tả chi tiết từ 3-5 câu bằng tiếng Việt về nội dung, bối cảnh và tâm trạng của hình ảnh."
                        },
                        textInImage: {
                            type: Type.STRING,
                            description: "Tất cả văn bản được trích xuất từ hình ảnh."
                        }
                    },
                    required: ["description", "textInImage"]
                }
            }
        });

        const jsonString = response.text;
        const result: Omit<ImageAnalysisResult, 'type'> = JSON.parse(jsonString);
        return { ...result, type: 'image' };

    } catch (error) {
        throw handleApiError(error);
    }
};

const PROMPT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        goal_summary: { type: Type.STRING, description: "Một câu tóm tắt mục tiêu của nội dung." },
        title: { type: Type.STRING, description: "Tiêu đề/Hook của bài đăng." },
        caption: { type: Type.STRING, description: "Nội dung chính của bài đăng, giới hạn ≤150 từ." },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Một mảng các hashtag liên quan." },
        suggested_image_ideas: { type: Type.STRING, description: "Gợi ý về hình ảnh hoặc video đi kèm." },
        optimal_post_time: { type: Type.STRING, description: "Thời gian đăng bài tối ưu được đề xuất." },
        optimization_tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 gợi ý tối ưu hóa (thời gian đăng, asset, micro-target)." },
        implementation_notes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-4 ghi chú/điểm cần lưu ý khi triển khai." },
    },
    required: ["goal_summary", "title", "caption", "hashtags", "suggested_image_ideas", "optimal_post_time", "optimization_tips", "implementation_notes"]
};

const PROMPT_KIDS_BODY = `
🪄 Vai trò & Nhiệm vụ: Bạn là GEMS — Content Writer chuyên lĩnh vực giáo dục mầm non / tiếng Anh cho phụ huynh có con nhỏ. Nhiệm vụ: Nhận brief / idea / context / mô tả phương tiện từ người dùng và tạo social content tối ưu, mặc định là caption cho fanpage Facebook.
✍️ Tôn chỉ & Phong cách viết: Ngôn ngữ Tiếng Việt chuẩn, thân thiện, chuyên nghiệp. Tone of voice Ấm áp – Thấu hiểu – Tích cực – Trẻ trung – Có chiều sâu giáo dục. Xưng hô: “IRIS” và “ba mẹ”. Không hứa hẹn quá mức, dùng từ tiêu cực, gây hoang mang.
💡 Insight cốt lõi: Khủng Hoảng Niềm Tin (cần “an tâm”); Ma Trận Chọn Trường (cần người dẫn lối); Giờ Vàng tương tác cao (Thứ Ba–Thứ Năm, 12:00–14:00, 20:00–22:00).
🧱 Concept truyền thông: Kiến thức & giá trị hữu ích; Câu chuyện thật của trẻ.
⚙️ Yêu cầu kỹ thuật: Cấu trúc caption: Hook (tiêu đề) → Thân bài (2–3 đoạn ngắn) → CTA cụ thể. Giới hạn: ≤150 từ. Bắt buộc: có ít nhất 1 chi tiết thật (testimonial, lịch lớp, trích lời cô).
🌱 Từ khóa bắt buộc: Tất cả content cần lồng ghép tự nhiên keyword “Thực hành”, thể hiện triết lý “Học qua thực hành – Vững từ gốc.”
🎯 Targeting: Phụ huynh có con 2–6 tuổi tại Đà Nẵng.
✅ Output chuẩn: Trả về kết quả theo JSON schema đã định nghĩa.
`;

const PROMPT_MG_BODY = `
🪄 Vai trò & Nhiệm vụ: Bạn là GEMS — Content Writer chuyên giáo dục tiếng Anh cho người đi làm & sinh viên. Nhiệm vụ: Nhận brief/idea/context/mô tả phương tiện và tạo social content tối ưu (mặc định là Social post caption cho Facebook/Instagram).
✍️ Tôn chỉ & Phong cách viết: Viết tiếng Việt tự nhiên, gần gũi nhưng chuyên nghiệp. Tone: Thân thiện – Năng động – Truyền cảm hứng – Đồng cảm. Xưng hô: “IRIS” và “bạn”. Tránh hứa hẹn quá mức, ngôn từ gây hoang mang.
💡 Insight cốt lõi: Người đi làm cần khóa học linh động thời gian (Thông điệp: “Bận rộn không còn là rào cản Anh ngữ”, nhấn mạnh “Tự chọn lịch học”, “Học bù không phí”). Đăng tối ưu vào Thứ Ba–Thứ Tư (12:00 / 15:00 / 21:00).
🧱 Concept truyền thông: Giá trị hữu ích (checklist, mẹo, FAQ); Story thật từ học viên.
⚙️ Yêu cầu kỹ thuật: Cấu trúc caption: Hook → Thân bài (2–3 đoạn) → CTA. Phải có: chi tiết thật (testimonial, lịch học, trích lời giáo viên).
🎯 Targeting: Người đi làm & sinh viên tại Đà Nẵng muốn cải thiện tiếng Anh giao tiếp.
✅ Output chuẩn: Trả về kết quả theo JSON schema đã định nghĩa. Footer mặc định: IRIS English - Học Tiếng Anh NGHE - NÓI Cho Người Đi Làm & Sinh Viên | Website: https://iris.edu.vn/ | Hotline: 0236 6566 688 | #irisenglish #hoctienganhvungtugoc #tienganhchonguoidilam #tienganhchosinhvien #tienganhthuchanh
`;


export const generateSocialContent = async (
    analysisResult: AnalysisResult, 
    audience: 'kids' | 'mg', 
    feedback?: string
): Promise<{ result: SocialContentResult; prompt: string }> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const context = `Đây là bản tóm tắt và phân tích của một tệp phương tiện:\n- Loại tệp: ${analysisResult.type}\n- Mô tả: ${analysisResult.description}\n` +
        (analysisResult.type === 'video' ? `- Bản ghi: ${(analysisResult as VideoAnalysisResult).transcript}\n` : `- Văn bản trong ảnh: ${(analysisResult as ImageAnalysisResult).textInImage}\n`);

    const basePrompt = audience === 'kids' ? PROMPT_KIDS_BODY : PROMPT_MG_BODY;

    let feedbackInstruction = '';
    if (feedback && feedback.trim()) {
        feedbackInstruction = `\nQUAN TRỌNG: Dưới đây là phản hồi và đánh giá từ người dùng về phiên bản nội dung trước. Hãy phân tích kỹ và sử dụng thông tin này để tạo ra một phiên bản mới, cải tiến hơn:\n---\n${feedback}\n---\n`;
    }

    const finalPrompt = `Dựa trên thông tin phân tích phương tiện sau đây:\n\n${context}\n\n${feedbackInstruction}Hãy thực hiện nhiệm vụ sau:\n\n${basePrompt}\n\nLưu ý quan trọng: Chỉ trả về một đối tượng JSON hợp lệ duy nhất theo schema đã chỉ định. Không thêm bất kỳ văn bản, ghi chú hay định dạng markdown nào khác bên ngoài đối tượng JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: finalPrompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: PROMPT_SCHEMA as any,
            }
        });

        const jsonString = response.text;
        const result = JSON.parse(jsonString) as SocialContentResult;
        return { result, prompt: finalPrompt };

    } catch (error) {
        throw handleApiError(error);
    }
};