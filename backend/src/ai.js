const HF_API_KEY = process.env.HF_API_KEY || "";
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

const SYSTEM_PROMPTS = {
  general: `أنت مساعد ذكي لفرع IEEE ANU. مهمتك مساعدة المستخدمين بطريقة ودية ومهنية.

المعلومات عن IEEE ANU:
- IEEE ANU هو فرع لمعهد المهندسين الكهربائيين والإلكترونيين
- يوفر الفرع فرصاً للطلاب للتطوير المهني والشبكات
- ينظم ورش عمل ومحاضرات وفعاليات
- يقدم برامج للتطوير المهني والقيادة

قواعدك:
- تحدث باللغة العربية دائماً
- كن ودوداً ومحترماً
- إذا لم تعرف الإجابة، قل أنك لست متأكداً واقترح التواصل مع الإدارة
- لا تعطي معلومات خاطئة
- كن مختصراً ومفيداً في إجاباتك`,

  admin: `أنت مساعد ذكي للإدارة في IEEE ANU. مهمتك مساعدة الإدارة في تحليل البيانات واتخاذ القرارات.

المعلومات عن IEEE ANU:
- IEEE ANU هو فرع لمعهد المهندسين الكهربائيين والإلكترونيين
- يدير طلبات الانضمام والفعاليات والمحتوى
- يحتاج إلى تحليل الطلبات والمستخدمين والفعاليات

قواعدك:
- تحدث باللغة العربية دائماً
- كن تحليلياً ومهنياً
- قدم رؤى قابلة للتنفيذ
- استخدم البيانات المتاحة لتقديم توصيات
- كن مختصراً ومباشراً`,

  application_analysis: `أنت مساعد ذكي لتحليل طلبات الانضمام في IEEE ANU. مهمتك تحليل طلبات الانضمام وتقديم توصيات.

المعايير المهمة في طلبات الانضمام:
- الخبرة السابقة والأنشطة الطلابية
- المهارات التقنية والقيادية
- الساعات المتاحة للعمل التطوعي
- الدافع للانضمام (لماذا يريد الانضمام)
- المهارات المطلوبة

قواعدك:
- تحدث باللغة العربية دائماً
- قم بتقييم كل طلب بناءً على المعايير
- قدم توصية (مقبول/مرفوض/بحاجة لمقابلة)
- اشرح سبب التوصية
- كن عادلاً وموضوعياً`
};

async function callHuggingFaceAPI(prompt, maxTokens = 500) {
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature: 0.7,
            return_full_text: false
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Hugging Face API Error:", error);
      throw new Error("فشل الاتصال بالذكاء الاصطناعي");
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      return data[0].generated_text || "";
    }
    
    return "";
  } catch (error) {
    console.error("Hugging Face API Error:", error);
    throw error;
  }
}

export async function chatWithAI(messages, type = "general") {
  try {
    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.general;
    
    // Format messages for Hugging Face
    const conversationHistory = messages.map(msg => {
      if (msg.role === "user") {
        return `[INST] ${msg.content} [/INST]`;
      }
      return msg.content;
    }).join("\n");

    const prompt = `${systemPrompt}\n\n${conversationHistory}`;
    
    const response = await callHuggingFaceAPI(prompt, 500);

    return {
      success: true,
      message: response || "حدث خطأ في معالجة الرد."
    };
  } catch (error) {
    console.error("AI Chat Error:", error);
    return {
      success: false,
      message: "حدث خطأ في الاتصال بالذكاء الاصطناعي. حاول مرة أخرى لاحقاً."
    };
  }
}

export async function analyzeApplication(application) {
  try {
    const prompt = `${SYSTEM_PROMPTS.application_analysis}

حلل هذا الطلب للانضمام:

الاسم: ${application.fullName}
البريد الجامعي: ${application.universityEmail}
العمر: ${application.age}
البلد: ${application.country}
الساعات المتاحة: ${application.hours}
الخبرة: ${application.experience}
لماذا يريد الانضمام: ${application.whyJoin}
المهارات: ${application.skills.join(", ")}
طريقة المعرفة: ${application.referral || "غير محدد"}

قدم تقييماً وتوصية (مقبول/مرفوض/بحاجة لمقابلة) مع شرح مختصر.`;

    const response = await callHuggingFaceAPI(prompt, 400);

    return {
      success: true,
      analysis: response || "حدث خطأ في تحليل الطلب."
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      success: false,
      analysis: "حدث خطأ في تحليل الطلب."
    };
  }
}

export async function getAdminInsights(data) {
  try {
    const prompt = `${SYSTEM_PROMPTS.admin}

حلل هذه البيانات من لوحة الإدارة:

عدد المستخدمين: ${data.usersCount}
عدد الطلبات: ${data.applicationsCount}
الطلبات المعلقة: ${data.pendingApplications}

قدم رؤى وتوصيات لتحسين الأداء.`;

    const response = await callHuggingFaceAPI(prompt, 400);

    return {
      success: true,
      insights: response || "حدث خطأ في تحليل البيانات."
    };
  } catch (error) {
    console.error("AI Insights Error:", error);
    return {
      success: false,
      insights: "حدث خطأ في تحليل البيانات."
    };
  }
}
