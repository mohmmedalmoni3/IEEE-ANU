import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPTS = {
  general: `أنت مساعد ذكي لفرع IEEE ANU. مهمتك مساعدة المستخدمين بطريقة ودودة ومهنية.

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

export async function chatWithAI(messages, type = "general") {
  try {
    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.general;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return {
      success: true,
      message: response.choices[0].message.content
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return {
      success: false,
      message: "حدث خطأ في الاتصال بالذكاء الاصطناعي. حاول مرة أخرى لاحقاً."
    };
  }
}

export async function analyzeApplication(application) {
  try {
    const prompt = `حلل هذا الطلب للانضمام:

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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.application_analysis },
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.5
    });

    return {
      success: true,
      analysis: response.choices[0].message.content
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return {
      success: false,
      analysis: "حدث خطأ في تحليل الطلب."
    };
  }
}

export async function getAdminInsights(data) {
  try {
    const prompt = `حلل هذه البيانات من لوحة الإدارة:

عدد المستخدمين: ${data.usersCount}
عدد الطلبات: ${data.applicationsCount}
الطلبات المعلقة: ${data.pendingApplications}

قدم رؤى وتوصيات لتحسين الأداء.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.admin },
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.6
    });

    return {
      success: true,
      insights: response.choices[0].message.content
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return {
      success: false,
      insights: "حدث خطأ في تحليل البيانات."
    };
  }
}
