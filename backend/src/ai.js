const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
// استخدام Groq API - أسرع ومجاني للاستخدام الأساسي
const GROQ_MODEL = "llama3-8b-8192";

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

async function callGroqAPI(messages, maxTokens = 500) {
  try {
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is missing");
      throw new Error("مفتاح Groq API مفقود");
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: messages,
          max_tokens: maxTokens,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API Error:", response.status, errorText);
      throw new Error(`فشل الاتصال: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content || "";
    }
    
    if (data.error) {
      console.error("Groq Error:", data.error);
      throw new Error(data.error.message || "خطأ في API");
    }
    
    return "";
  } catch (error) {
    console.error("Groq API Error:", error.message);
    throw error;
  }
}

export async function chatWithAI(messages, type = "general") {
  try {
    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.general;
    
    // Format messages for Groq API
    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];
    
    const response = await callGroqAPI(groqMessages, 500);

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

    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPTS.application_analysis },
      { role: "user", content: prompt }
    ];

    const response = await callGroqAPI(groqMessages, 400);

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

    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPTS.admin },
      { role: "user", content: prompt }
    ];

    const response = await callGroqAPI(groqMessages, 400);

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
