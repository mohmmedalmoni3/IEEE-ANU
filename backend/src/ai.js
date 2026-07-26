const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || "";
// استخدام Together AI - مجاني للبداية مع نماذج قوية
const TOGETHER_MODEL = "meta-llama/Llama-3-70b-chat-hf";
const USE_AI_FALLBACK = true; // العودة للكلمات المفتاحية إذا فشل AI

const responses = {
  // ردود عامة
  general: {
    keywords: {
      "مرحبا": "أهلاً وسهلاً! أنا مساعد IEEE ANU الذكي. كيف يمكنني مساعدتك اليوم؟",
      "السلام": "وعليكم السلام ورحمة الله وبركاته! أنا هنا لمساعدتك في أي سؤال عن IEEE ANU.",
      "من أنت": "أنا مساعد ذكي لفرع IEEE ANU الطلابي. مهمتي مساعدتك في معرفة المزيد عن الفرع وخدماته.",
      "ما هو": "IEEE ANU هو فرع طلابي لمعهد المهندسين الكهربائيين والإلكترونيين في جامعة عجلون الوطنية.",
      "ieee": "IEEE هو أكبر منظمة تقنية في العالم تهدف لتطوير التكنولوجيا والعلوم.",
      "عجلون": "IEEE ANU هو فرع IEEE في جامعة عجلون الوطنية في الأردن.",
      "انضم": "للانضمام إلى IEEE ANU، يمكنك تقديم طلب من خلال صفحة التقديمات في موقعنا.",
      "تقديم": "يمكنك تقديم طلب الانضمام من خلال صفحة التقديمات. ستحتاج لملء بياناتك ومهاراتك.",
      "عضو": "للتسجيل كعضو، قم بإنشاء حساب ثم قدم طلب انضمام من خلال الموقع.",
      "ورشة": "ننظم ورش عمل دورية في مختلف المجالات التقنية. تابع صفحتنا للتعرف عن الورش القادمة.",
      "فعالية": "ننظم فعاليات تقنية واجتماعية للطلاب. يمكنك الاطلاع عليها في الموقع.",
      "مجاني": "عضوية IEEE ANU مجانية للطلاب المقبولين!",
      "رسوم": "لا توجد رسوم للعضوية في IEEE ANU.",
      "تواصل": "يمكنك التواصل معنا عبر البريد الإلكتروني أو حساباتنا على وسائل التواصل الاجتماعي.",
      "اتصل": "يمكنك التواصل معنا عبر البريد: ieeeanusupport@gmail.com",
      "بريد": "بريد التواصل: ieeeanusupport@gmail.com",
      "إنستقرام": "تابعنا على إنستقرام: @ieee_anu",
      "فيسبوك": "تابعنا على فيسبوك للتعرف عن أخبارنا.",
      "مهارة": "نبحث عن مهارات متنوعة: برمجة، تصميم، إدارة محتوى، تنظيم، وغيرها.",
      "برمجة": "نحتاج مطورين في مختلف اللغات: JavaScript, Python, وغيرها.",
      "تصميم": "نحتاج مصممين جرافيك وUI/UX.",
      "محتوى": "نحتاج منشئي محتوى تقني ومترجمين.",
      "شكر": "على الرحب والسعة! أنا هنا دائماً لمساعدتك.",
      "شكرا": "شكراً لك! إذا احتجت أي مساعدة أخرى، أنا هنا.",
      "مساعدة": "بالتأكيد! كيف يمكنني مساعدتك؟",
      "سؤال": "تفضل، اسأل أي سؤال عن IEEE ANU وسأجيبك.",
      "مشروع": "نقدم فرصاً للمشاركة في مشاريع تقنية حقيقية.",
      "تدريب": "نقدم ورش عمل تدريبية لتطوير مهاراتك.",
      "تعلم": "IEEE ANU بيئة ممتازة للتعلم والتطوير المهني.",
      "فريق": "نحن فريق من الطلاب الشغوفين بالتكنولوجيا.",
      "هدف": "هدفنا تطوير مهارات الطلاب وتعزيز المجتمع التقني.",
      "رئيس": "يمكنك معرفة فريق الإدارة من خلال صفحة من نحن.",
      "قائد": "يمكنك معرفة قادة الفريق من خلال صفحة من نحن.",
      "قوانين": "قوانين IEEE ANU متاحة في صفحة القوانين في الموقع.",
      "قانون": "يرجى قراءة قوانين الفرع قبل التقديم من صفحة القوانين.",
      "موقع": "موقعنا الرسمي يحتوي على كل المعلومات عن IEEE ANU.",
      "رابط": "يمكنك العثور على جميع روابطنا في صفحة من نحن.",
      "من برمج": "تم تطوير موقع IEEE ANU من قبل فريق تقني متخصص. إذا كنت مهتماً بالانضمام للفريق التقني، يمكنك التقديم من خلال صفحة التقديمات.",
      "مبرمج": "تم تطوير الموقع من قبل فريق IEEE ANU التقني. نحن دائماً نبحث عن مطورين جدد للانضمام إلينا!",
      "طور": "تم تطوير الموقع من قبل فريق IEEE ANU التقني باستخدام تقنيات حديثة مثل Next.js و Node.js.",
      "صنع": "تم تصميم وتطوير الموقع من قبل فريق IEEE ANU التقني.",
      "من صنع": "تم تصميم وتطوير الموقع من قبل فريق IEEE ANU التقني.",
      "من طور": "تم تطوير الموقع من قبل فريق IEEE ANU التقني باستخدام تقنيات حديثة.",
      "من أنشأ": "تم إنشاء الموقع من قبل فريق IEEE ANU التقني.",
      "من صمم": "تم تصميم الموقع من قبل فريق IEEE ANU التقني.",
      "فريق تقني": "فريق IEEE ANU التقني مسؤول عن تطوير وصيانة الموقع.",
      "فريق التطوير": "فريق IEEE ANU التقني مسؤول عن تطوير وصيانة الموقع.",
      "المطورين": "المطورون هم أعضاء فريق IEEE ANU التقني.",
      "المطور": "المطورون هم أعضاء فريق IEEE ANU التقني."
    },
    default: "شكراً لتواصلك مع IEEE ANU! يمكنني مساعدتك في الأسئلة عن الفرع، التقديمات، الورش، والفعاليات. كيف يمكنني مساعدتك؟"
  },
  
  // ردود تحليل الطلبات
  application_analysis: {
    keywords: {},
    default: "بناءً على المعلومات المقدمة، يبدو أن المرشح لديه إمكانيات جيدة. يُنصح بإجراء مقابلة لتقييم المهارات والالتزام بشكل أفضل."
  },
  
  // ردود الإدارة
  admin: {
    keywords: {},
    default: "بناءً على البيانات الحالية، يُنصح بالتركيز على زيادة التسويق لجذب المزيد من الأعضاء وتنويع الورش العملية."
  }
};

async function callTogetherAI(messages, maxTokens = 500) {
  try {
    if (!TOGETHER_API_KEY) {
      console.error("TOGETHER_API_KEY is missing");
      throw new Error("مفتاح Together AI مفقود");
    }

    const response = await fetch(
      "https://api.together.xyz/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOGETHER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: TOGETHER_MODEL,
          messages: messages,
          max_tokens: maxTokens,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Together AI Error:", response.status, errorText);
      throw new Error(`فشل الاتصال: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content || "";
    }
    
    if (data.error) {
      console.error("Together AI Error:", data.error);
      throw new Error(data.error.message || "خطأ في API");
    }
    
    return "";
  } catch (error) {
    console.error("Together AI Error:", error.message);
    throw error;
  }
}

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

export async function chatWithAI(messages, type = "general") {
  try {
    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.general;
    
    // Format messages for Together AI
    const togetherMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];
    
    const response = await callTogetherAI(togetherMessages, 500);

    return {
      success: true,
      message: response || "حدث خطأ في معالجة الرد."
    };
  } catch (error) {
    console.error("AI Chat Error:", error);
    
    // العودة للكلمات المفتاحية إذا فشل AI
    if (USE_AI_FALLBACK) {
      console.log("Falling back to keyword responses");
      const lastMessage = messages[messages.length - 1]?.content || "";
      const fallbackResponse = getKeywordResponse(lastMessage, type);
      
      return {
        success: true,
        message: fallbackResponse
      };
    }
    
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

    const togetherMessages = [
      { role: "system", content: SYSTEM_PROMPTS.application_analysis },
      { role: "user", content: prompt }
    ];

    const response = await callTogetherAI(togetherMessages, 400);

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
الطلبات المعلقة:${data.pendingApplications}

قدم رؤى وتوصيات لتحسين الأداء.`;

    const togetherMessages = [
      { role: "system", content: SYSTEM_PROMPTS.admin },
      { role: "user", content: prompt }
    ];

    const response = await callTogetherAI(togetherMessages, 400);

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
