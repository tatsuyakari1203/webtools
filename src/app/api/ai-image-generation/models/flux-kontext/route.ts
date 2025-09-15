import { NextRequest, NextResponse } from 'next/server';

export interface FluxKontextRequest {
  prompt: string;
  image_url?: string;
  image_base64?: string; // Will be converted to image_url
  aspect_ratio?: "21:9" | "16:9" | "4:3" | "3:2" | "1:1" | "2:3" | "3:4" | "9:16" | "9:21";
  num_images?: number;
  sync_mode?: boolean;
  seed?: number;
  safety_tolerance?: string;
  guidance_scale?: number;
  enhance_prompt?: boolean;
  output_format?: string;
}

export interface FluxKontextResponse {
  images: {
    height: number;
    url: string;
    width: number;
  }[];
  timings: Record<string, number>;
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

export async function POST(request: NextRequest) {
  // Kiểm tra API key
  const apiKey = process.env.FAL_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'FAL API key is not configured' },
      { status: 500 }
    );
  }

  try {
    // Lấy dữ liệu từ request
    const requestData: FluxKontextRequest = await request.json();

    // Kiểm tra các trường bắt buộc
    if (!requestData.prompt || (!requestData.image_url && !requestData.image_base64)) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and either image_url or image_base64 are required' },
        { status: 400 }
      );
    }
    
    // Validate prompt length (FAL có thể có giới hạn)
    if (requestData.prompt.length > 4000) {
      return NextResponse.json(
        { error: 'Prompt too long, maximum 4000 characters' },
        { status: 400 }
      );
    }

    // Log để debug - kiểm tra dữ liệu nhận được
    console.log('Flux Kontext request received:', {
      hasPrompt: !!requestData.prompt,
      hasImageUrl: !!requestData.image_url,
      hasImageBase64: !!requestData.image_base64,
      aspectRatio: requestData.aspect_ratio,
      numImages: requestData.num_images
    });

    // Chuẩn bị dữ liệu để gửi đến FAL API - sử dụng các giá trị từ client
    const falRequestData: {
      prompt: string;
      image_url: string;
      aspect_ratio?: string;
      num_images?: number;
      sync_mode?: boolean;
      seed?: number;
      safety_tolerance?: string;
      guidance_scale?: number;
      enhance_prompt?: boolean;
      output_format?: string;
    } = {
      prompt: requestData.prompt,
      image_url: '',
      sync_mode: true, // Luôn true để đồng bộ
      // Sử dụng giá trị từ client với giới hạn hợp lý
      num_images: Math.min(requestData.num_images || 1, 4),
      safety_tolerance: requestData.safety_tolerance || '2',
      guidance_scale: requestData.guidance_scale || 3.5,
      enhance_prompt: requestData.enhance_prompt || false,
      output_format: requestData.output_format || 'jpeg',
    };
    
    // Chỉ thêm optional fields nếu có giá trị hợp lệ
    if (requestData.aspect_ratio) {
      falRequestData.aspect_ratio = requestData.aspect_ratio;
    }
    if (requestData.seed !== undefined) {
      falRequestData.seed = requestData.seed;
    }
    
    // Xử lý hình ảnh - chỉ sử dụng image_url như yêu cầu của FAL API
    try {
      if (requestData.image_base64) {
        // Chuyển đổi base64 thành data URL giống Seedream
        if (requestData.image_base64.startsWith('data:')) {
          falRequestData.image_url = requestData.image_base64;
        } else {
          // Đảm bảo đúng định dạng MIME type cho data URL
          falRequestData.image_url = `data:image/png;base64,${requestData.image_base64}`;
        }
      } else if (requestData.image_url) {
        // Sử dụng image_url trực tiếp
        falRequestData.image_url = requestData.image_url;
      }
      
      // Log để debug image processing
      console.log('Processed image URL:', {
        hasImageUrl: !!falRequestData.image_url,
        urlLength: falRequestData.image_url?.length,
        urlPrefix: falRequestData.image_url?.substring(0, 50)
      });
      
      // Kiểm tra xem image_url có hợp lệ không
      if (!falRequestData.image_url) {
        return NextResponse.json(
          { error: 'No valid image data provided' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error processing image data:', error);
      return NextResponse.json(
        { error: 'Error processing image data', details: error instanceof Error ? error.message : String(error) },
        { status: 400 }
      );
    }

    // Log payload sẽ gửi đến FAL API để debug
    console.log('Sending to FAL API:', {
      url: 'https://fal.run/fal-ai/flux-pro/kontext',
      promptLength: falRequestData.prompt.length,
      hasImageUrl: !!falRequestData.image_url,
      imageUrlLength: falRequestData.image_url?.length,
      imageUrlPrefix: falRequestData.image_url?.substring(0, 50),
      aspectRatio: falRequestData.aspect_ratio,
      numImages: falRequestData.num_images,
      syncMode: falRequestData.sync_mode,
      fullPayload: falRequestData
    });

    // Gọi API của FAL
    const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(falRequestData),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        // Log chi tiết validation errors
        console.error('FAL API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          fullError: errorData,
          detail: errorData.detail || 'No detail provided'
        });
      } catch {
        const errorText = await response.text();
        errorData = { message: errorText };
        console.error('FAL API Text Error:', errorText);
      }
      
      // Trích xuất chi tiết lỗi từ FAL API
      let errorMessage = 'Error from FAL API';
      if (errorData.detail && Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((item: { loc?: string[], msg: string }) => 
          `${item.loc?.join('.') || 'field'}: ${item.msg}`
        ).join(', ');
      } else if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail);
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorData,
          originalError: 'FAL API validation error'
        },
        { status: response.status }
      );
    }

    // Xử lý phản hồi từ FAL API
    const responseData = await response.json();

    // Nếu sync_mode là false, trả về response ngay lập tức
    if (!falRequestData.sync_mode) {
      return NextResponse.json(responseData);
    }

    // Nếu sync_mode là true, đợi kết quả từ FAL API
    if (responseData.status === 'COMPLETED') {
      // Lấy kết quả từ response_url
      const resultResponse = await fetch(responseData.response_url);
      if (!resultResponse.ok) {
        return NextResponse.json(
          { error: 'Error fetching result from FAL API' },
          { status: resultResponse.status }
        );
      }
      const resultData = await resultResponse.json();
      return NextResponse.json(resultData);
    } else {
      // Trả về trạng thái hiện tại nếu chưa hoàn thành
      return NextResponse.json(responseData);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}