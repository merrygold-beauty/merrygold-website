// Guide content shared by a whole family of treatments: what the family is,
// who it suits, what to do before an appointment, aftercare and good-to-know
// notes. Written from the owner's own treatment write-ups (2026-09-19).
//
// A treatment points at its family through its `guide` field in
// treatments.js, and src/lib/treatmentGuide.js merges the two for the
// "About this treatment" sheet. Anything specific to one treatment belongs on
// that treatment, not here.
export const treatmentGuides = {
  "facials": {
    name: "Facial treatments",
    intro: "Facial treatments are personalised to your skin type, concerns and goals, whether that is dryness, congestion, dullness, uneven-looking skin or early signs of ageing. Every facial begins with a skin consultation, and your treatment may include cleansing, exfoliation, extraction, hydration, masks, serums and massage, depending on which facial is selected.",
    suitableFor: "Most skin types can be matched to a suitable facial once your skin has been assessed at consultation.",
    notSuitableFor: "Some facials may need to be modified, postponed or avoided depending on your skin condition, medical history or recent procedures, so tell your therapist about these before booking.",
    before: [
      "Tell your therapist about any allergies.",
      "Let us know if you are pregnant or breastfeeding.",
      "Tell us about any skin conditions or recent aesthetic procedures.",
      "Tell us about any medications or prescription skincare products you use, including retinoids and active acids.",
      "Some facials may need to be modified, postponed or avoided depending on your skin and medical history."
    ],
    aftercare: [
      "Avoid touching or picking your skin unnecessarily.",
      "Keep your skin clean and well moisturised.",
      "Wear broad-spectrum SPF daily.",
      "Avoid excessive sun exposure.",
      "Avoid saunas, steam rooms and intense heat immediately after more active treatments.",
      "Avoid retinoids, exfoliating acids and other strong active products when advised by your therapist.",
      "Follow your personalised homecare recommendations."
    ],
    goodToKnow: [
      "Some clients experience temporary redness or sensitivity after certain treatments; your therapist will explain what to expect for the facial you receive.",
      "Your therapist may recommend a course of treatments or a regular schedule depending on your skin."
    ],
    notice: "Every facial follows a skin consultation, and your therapist will explain what to expect for the treatment you receive."
  },
  "microneedling": {
    name: "Microneedling",
    intro: "Microneedling uses controlled, ultra-fine needles to create microscopic channels in the skin. This is intended to work with the skin's natural repair response and support collagen production, and treatment begins with a consultation and skin assessment so it can be personalised to your skin and suitability.",
    suitableFor: "May suit clients concerned with fine lines, uneven skin texture, enlarged pores, certain types of acne scarring, dull-looking skin or loss of firmness.",
    notSuitableFor: "Treatment may not be suitable during active skin infections, active inflammatory acne, certain medical conditions, pregnancy or when taking certain medications, and your suitability will be assessed before treatment.",
    before: [
      "Your treatment begins with a consultation and skin assessment.",
      "Tell your practitioner if you have active skin infections or active inflammatory acne.",
      "Tell your practitioner about any relevant medical conditions.",
      "Tell your practitioner if you are pregnant.",
      "Tell your practitioner about any medications you are taking.",
      "Your suitability will be assessed before treatment."
    ],
    aftercare: [
      "Keep the treated area clean and avoid touching it unnecessarily.",
      "Do not pick or peel the skin.",
      "Avoid retinoids, exfoliating acids, scrubs and other strong active skincare.",
      "Avoid strenuous exercise, swimming, saunas and steam rooms initially.",
      "Avoid direct sun exposure and tanning.",
      "Use gentle skincare recommended by your practitioner.",
      "Apply broad-spectrum SPF 30 to 50 daily.",
      "Avoid makeup for the period advised following treatment."
    ],
    goodToKnow: [
      "Temporary redness, warmth, tightness, dryness or mild swelling can occur afterwards; the skin may look similar to mild sunburn at first before settling as it recovers.",
      "A course of treatments may be recommended depending on your skin concerns and desired outcome.",
      "Treatment takes approximately 45 to 60 minutes including skin preparation, and can vary depending on the area treated."
    ],
    notice: "Consultation required. Treatment is subject to suitability, and individual results vary."
  },
  "chemical-peels": {
    name: "Chemical peels",
    intro: "Chemical peels use carefully selected exfoliating solutions to remove damaged surface skin cells and encourage a fresher, smoother-looking complexion. Peels are not one-size-fits-all: your skin is assessed before treatment so the type and strength of peel can be selected for your skin type, concerns and goals.",
    suitableFor: "Peels can be selected for different skin types and concerns, including dull skin, uneven-looking tone, congestion, oily or blemish-prone skin, rough texture, superficial pigmentation and visible signs of ageing.",
    notSuitableFor: "Not every peel is appropriate for every skin type. Your practitioner will consider your skin sensitivity, medical history, medications, recent treatments and current skincare products before proceeding, and a patch test may be required for certain products or protocols.",
    before: [
      "Your skin will be assessed before treatment so the peel can be matched to your skin.",
      "Tell your practitioner about your medical history and any medications you are taking.",
      "Tell your practitioner about any recent treatments or current skincare products.",
      "A patch test may be required for certain products or protocols."
    ],
    aftercare: [
      "Do not pick, peel or pull flaking skin.",
      "Avoid retinoids, exfoliating acids and scrubs until advised.",
      "Avoid waxing or other potentially irritating facial treatments until the skin has recovered.",
      "Avoid excessive heat, steam rooms, saunas and strenuous exercise initially.",
      "Avoid direct sun exposure and tanning.",
      "Keep the skin moisturised with appropriate gentle products.",
      "Apply broad-spectrum SPF 30 to 50 every day.",
      "Follow all personalised aftercare instructions."
    ],
    goodToKnow: [
      "Depending on the type and strength of peel, you may experience temporary redness, sensitivity, dryness, tightness or visible flaking.",
      "Not every peel causes visible peeling, and a lack of visible peeling does not necessarily mean the treatment has not worked.",
      "A course of treatments may be recommended for certain concerns."
    ],
    notice: "Peel type and strength are selected following a professional skin consultation, and individual results vary."
  },
  "led-light-therapy": {
    name: "LED light therapy",
    intro: "LED Light Therapy is a non-invasive treatment using specific wavelengths of visible and near-infrared light as part of a skincare programme. It can be offered as a standalone treatment or added to selected facials where appropriate.",
    suitableFor: "May suit clients looking for a gentle, non-invasive addition to their skincare programme.",
    notSuitableFor: "Suitability will be assessed before treatment, particularly if you have photosensitivity, certain eye conditions, medical conditions, or take medications that increase sensitivity to light.",
    before: [
      "Suitability will be assessed before treatment.",
      "Tell your therapist if you have photosensitivity or certain eye conditions.",
      "Tell your therapist about any medical conditions or medications that increase sensitivity to light.",
      "Appropriate eye protection will be provided where required."
    ],
    aftercare: [
      "Continue your normal gentle skincare routine unless advised otherwise.",
      "Keep the skin hydrated.",
      "Apply broad-spectrum SPF daily.",
      "Avoid unnecessary sun exposure.",
      "Follow any additional aftercare instructions if LED therapy was combined with another procedure."
    ],
    goodToKnow: [
      "LED therapy generally requires minimal downtime.",
      "Treatment takes approximately 20 to 30 minutes of LED exposure, though the full appointment may be longer when combined with another facial treatment.",
      "A course of sessions may be recommended depending on your skin goals and the device protocol.",
      "When LED is combined with treatments such as chemical peels or microneedling, follow the aftercare for the primary procedure."
    ],
    notice: "Consultation and suitability assessment may be required, and treatment outcomes vary between individuals."
  },
  "massage": {
    name: "Massage treatments",
    intro: "Massage treatments are designed to give you time away from everyday stress, with personalised care for your body. Every session begins with a short consultation to understand your preferred pressure, areas of tension and any relevant health considerations.",
    suitableFor: "Most clients can be matched to a suitable massage, from a gentle relaxation treatment to a firmer, more focused one.",
    notSuitableFor: "Massage may need to be modified, postponed or declined for clients with certain injuries, infections, circulatory problems or other medical conditions, so tell your therapist about these before treatment.",
    before: [
      "Tell us if you are pregnant or have recently given birth.",
      "Tell us if you have recently undergone surgery.",
      "Tell us about any current injury or unexplained pain.",
      "Tell us if you have a fever or an active infection.",
      "Tell us about skin infections, open wounds or significant inflammation.",
      "Tell us about a history of blood clots or circulatory problems.",
      "Tell us about heart, kidney or other significant medical conditions.",
      "Tell us about any medication that may affect treatment.",
      "Tell us about any allergies or sensitivities."
    ],
    aftercare: [
      "Drink water according to your normal hydration needs.",
      "Allow yourself time to rest and enjoy the relaxed feeling.",
      "Avoid strenuous exercise immediately afterwards if your muscles feel tender or fatigued.",
      "Mild temporary tenderness can occur following deeper massage.",
      "Follow any personalised aftercare advice provided by your therapist."
    ],
    goodToKnow: [
      "Massage should feel comfortable and therapeutic, not excessively painful, so let your therapist know if you want the pressure adjusted.",
      "Where appropriate, we may modify, postpone or decline massage and recommend advice from a healthcare professional first."
    ],
    notice: "Treatment is subject to consultation and suitability, and massage is not a substitute for medical diagnosis or treatment."
  },
  "sensory-massage": {
    name: "Sensory massage",
    intro: "Sensory massage is designed to engage the senses through therapeutic touch, calming aromas, relaxing music and a peaceful treatment environment. Massage pressure and technique are personalised to your comfort and preferences.",
    suitableFor: "May suit adults who want to relax and unwind, experience everyday muscular tension, or want some dedicated self-care time.",
    notSuitableFor: "Treatment may need to be postponed if you are currently unwell, have a fever, an active infection or an acute injury, and clients with certain medical conditions may need advice from a healthcare professional first.",
    before: [
      "Tell your therapist if you are pregnant or breastfeeding.",
      "Tell your therapist about any allergies.",
      "Tell your therapist about recent injuries or surgery.",
      "Tell your therapist about skin conditions or circulatory concerns.",
      "Tell your therapist about significant pain or any medical condition that may affect your suitability for massage.",
      "Your appointment may need to be postponed if you are currently unwell, have a fever or an active infection."
    ],
    aftercare: [
      "Take some time to relax after your appointment.",
      "Drink fluids normally and stay comfortably hydrated.",
      "Avoid strenuous activity immediately afterwards if you feel particularly relaxed or tired.",
      "Avoid excessive heat if you feel light-headed after treatment.",
      "Rise slowly from the treatment bed.",
      "Follow any personalised advice provided by your therapist."
    ],
    goodToKnow: [
      "Some clients may experience temporary mild tenderness following deeper massage techniques; please contact the clinic if you experience an unexpected or concerning reaction.",
      "Unscented alternatives can be used where appropriate for clients with fragrance sensitivities.",
      "30 minutes is an express session, ideal for focused relaxation or attention to selected areas such as the back, neck and shoulders.",
      "45 minutes is a longer relaxation experience, allowing work across several areas of tension.",
      "60 minutes is a full body session, the complete sensory experience.",
      "90 minutes is an extended head to toe ritual for clients wanting more time to unwind."
    ],
    notice: "Treatment is subject to consultation and suitability. Sensory massage is intended for relaxation and wellbeing and is not a substitute for medical diagnosis or treatment."
  },
  "foot-facial": {
    name: "Foot facials",
    intro: "A foot facial applies the same care as a facial to the skin of the feet: cleansing, exfoliation, hydration and a relaxing massage, adapted to the condition of your skin and your individual needs.",
    suitableFor: "Suitable for many clients wanting to improve the cosmetic look and feel of their feet, particularly if they feel dry, rough, tired, in need of exfoliation or hydration, or neglected from everyday activity.",
    notSuitableFor: "A foot facial is not a substitute for medical foot care or podiatry. Please tell your therapist about open wounds, active fungal infection, infected or inflamed areas, significant unexplained swelling, severe pain, significant cracks, bleeding or sores, recent foot surgery or injury, known allergies, or diabetes or another condition affecting circulation, sensation or wound healing.",
    before: [
      "Arrive with clean feet where possible.",
      "Avoid aggressive exfoliation immediately before your appointment.",
      "Tell us about allergies or sensitive skin.",
      "Tell us about any foot or nail concerns before treatment begins.",
      "Let your therapist know immediately if anything feels uncomfortable.",
      "Where appropriate, we may recommend advice from a GP, pharmacist, podiatrist or other qualified healthcare professional before treatment."
    ],
    aftercare: [
      "Keep your feet clean and dry where appropriate.",
      "Apply a suitable moisturising foot cream regularly.",
      "Avoid picking or peeling dry skin.",
      "Gently exfoliate at home when appropriate, instead of aggressively scrubbing.",
      "Wear clean, comfortable footwear and socks.",
      "Stay hydrated as part of your general wellbeing routine.",
      "Avoid very hot water if your skin feels sensitive following treatment."
    ],
    goodToKnow: [
      "The ideal frequency depends on your skin, lifestyle and how quickly dryness or roughness returns, and your therapist can recommend a suitable schedule."
    ],
    notice: "This is a cosmetic beauty and wellness treatment and does not diagnose or treat medical foot conditions. Results vary depending on skin condition, lifestyle and home care, and treatment is subject to consultation and suitability."
  },
  "hand-facial": {
    name: "Hand facials",
    intro: "A hand facial applies skincare to the hands in the same way a facial cares for the face, combining cleansing, gentle exfoliation, intensive hydration and relaxing massage. Products and technique are selected according to the condition and sensitivity of your skin.",
    suitableFor: "Suitable for many clients wanting softer, smoother-feeling hands, additional hydration, regular hand-care maintenance, a relaxing beauty treatment, or care for hands frequently exposed to environmental or occupational dryness.",
    notSuitableFor: "Please tell your therapist about open cuts or wounds, broken or bleeding skin, active skin infection, significant unexplained redness or swelling, active contagious skin conditions, severe irritation, recent injury or surgery to the hand or wrist, known allergies, or significant pain, numbness or unexplained changes to your hands. Certain conditions may mean treatment is modified or postponed, and we may recommend speaking with a healthcare professional first.",
    before: [
      "Let us know about allergies or sensitive skin.",
      "Tell your therapist about any current skin conditions.",
      "Avoid aggressive exfoliation immediately before your appointment.",
      "Tell us about recent treatments or procedures on your hands.",
      "Let your therapist know if anything feels uncomfortable during treatment."
    ],
    aftercare: [
      "Moisturise your hands regularly.",
      "Apply hand cream after washing where practical.",
      "Avoid unnecessarily harsh soaps or products if your skin is sensitive.",
      "Wear protective gloves when using household cleaning products.",
      "Avoid picking or peeling dry skin.",
      "Use gentle exfoliation instead of aggressive scrubbing.",
      "Protect your hands from excessive environmental exposure and consider appropriate sun protection."
    ],
    goodToKnow: [
      "Your ideal treatment schedule depends on your skin, lifestyle and individual needs; some clients book monthly, others seasonally or before a particular event."
    ],
    notice: "This is a cosmetic beauty and wellness treatment and is not intended to diagnose or treat medical skin or hand conditions. Results vary depending on skin condition, lifestyle and home care, and all treatments are subject to consultation and suitability."
  },
  "face-scalp-massage": {
    name: "Facial and scalp massage",
    intro: "Facial and scalp massage use gentle, flowing and personalised techniques focused on relaxation and everyday tension. You can choose a facial massage, a scalp massage, or combine the two.",
    suitableFor: "May suit clients who experience everyday facial, jaw, temple or scalp tension, want a relaxing, non-invasive treatment, or simply want some quiet self-care time.",
    notSuitableFor: "Facial massage does not permanently lift or reshape the face, and scalp massage is a relaxation and wellbeing treatment, not intended to treat headaches, migraines, hair loss or medical scalp conditions. Tell your therapist about any active infection, open wounds, significant inflammation, recent surgery or injury, recent injectable or aesthetic procedures, or known allergies before treatment.",
    before: [
      "Tell your therapist about active skin or scalp infections, open wounds or broken skin.",
      "Tell your therapist about significant inflammation or irritation, or severe active acne in the treatment area.",
      "Tell your therapist about recent facial, head, neck or scalp surgery or injury.",
      "Tell your therapist if you have recently had anti-wrinkle injections, dermal fillers, threads, chemical peels, microneedling, laser treatments or another facial procedure, so we can check whether enough recovery time has passed.",
      "Tell your therapist about known allergies to skincare, oils or massage products.",
      "Let your therapist know about braids, extensions, wigs, hairpieces or a particularly sensitive scalp so the technique can be adapted."
    ],
    aftercare: [
      "Keep your skincare gentle and avoid rubbing or aggressively exfoliating your face.",
      "Use appropriate moisturiser and daytime SPF.",
      "Avoid strong active skincare immediately afterwards if your skin feels sensitive.",
      "Take your time getting up if you feel deeply relaxed.",
      "If oil has been used on the scalp, follow your therapist's advice on when to cleanse your hair.",
      "Allow yourself time to rest and enjoy the relaxed feeling."
    ],
    goodToKnow: [
      "Temporary mild redness can occur following massage and should usually settle.",
      "Your hair may naturally need restyling after a scalp massage."
    ],
    notice: "These are cosmetic beauty and relaxation treatments, not intended to diagnose, prevent or treat medical conditions. Treatment suitability and individual experiences vary, so please tell us about relevant medical conditions, recent procedures, injuries and allergies before treatment."
  },
  "iv-drip-therapy": {
    name: "IV drip treatment",
    intro: "IV therapy delivers fluids and selected ingredients directly into the bloodstream through an intravenous infusion, given by a qualified practitioner. Every treatment begins with a consultation and suitability assessment.",
    suitableFor: "Suitable for adults who have completed a consultation and have been assessed as clinically suitable for treatment.",
    notSuitableFor: "Treatment may be declined or postponed where it is not considered clinically appropriate, including for certain medical conditions, medications, or during pregnancy or breastfeeding.",
    before: [
      "Tell your practitioner about your medical history.",
      "Tell your practitioner about any medications and supplements you are taking.",
      "Tell your practitioner about any allergies.",
      "Tell your practitioner if you are pregnant or breastfeeding.",
      "Tell your practitioner about any kidney or heart problems.",
      "Treatment may be declined or postponed where it is not considered clinically appropriate."
    ],
    aftercare: [
      "Keep well hydrated unless a healthcare professional has advised you to restrict fluids.",
      "Avoid strenuous exercise immediately after treatment if you feel tired, dizzy or unwell.",
      "Keep the cannula site clean and avoid excessive rubbing or pressure.",
      "Mild temporary bruising, tenderness or redness can sometimes occur around the insertion site.",
      "Follow any personalised instructions provided by your practitioner.",
      "If you develop significant swelling, worsening redness or pain, breathing difficulties, chest pain, facial or throat swelling, fainting, or another severe or unexpected reaction, seek urgent medical attention."
    ],
    goodToKnow: [],
    notice: "Consultation required. Treatment is subject to clinical suitability. Individual experiences vary."
  },
  "laser-hair-removal": {
    name: "Laser Hair Removal",
    intro: "Laser hair removal aims to reduce unwanted hair over the longer term by directing controlled light energy at suitable hair follicles, usually across a course of sessions. We treat a wide range of facial and body areas, from small zones such as the upper lip to full body combinations, and every course begins with a consultation and patch test to check the treatment is right for your skin and hair.",
    suitableFor: "May suit many women and men wanting to reduce unwanted facial or body hair, though suitability depends on the specific laser technology used, your skin type, hair colour and medical history.",
    notSuitableFor: "Because laser treatment relies on pigment in the hair follicle, very light blonde, white, grey or some red hair may respond poorly to certain laser technologies, and treatment will only go ahead once your practitioner is satisfied it is appropriate for you.",
    before: [
      "Shave the treatment area as instructed before your appointment.",
      "Do not wax, thread, epilate or tweeze the hair for the period advised before treatment.",
      "Avoid tanning and deliberate sun exposure as instructed by your practitioner.",
      "Do not use fake tan on the treatment area before your appointment.",
      "Keep the treatment area free from perfume, deodorant, makeup or creams when instructed.",
      "Tell us about any new medication or changes to your health.",
      "Tell your practitioner if your skin has recently been exposed to significant sunlight."
    ],
    aftercare: [
      "Avoid scratching, rubbing or picking the treated area.",
      "Avoid excessive heat, hot baths, saunas and steam rooms for the period advised.",
      "Avoid strenuous exercise if your skin remains hot or sensitive.",
      "Avoid fragranced or irritating products on sensitive treated skin.",
      "Avoid waxing, threading, tweezing or epilating between sessions.",
      "Shaving may be used between appointments when appropriate.",
      "Protect exposed treated areas from excessive sunlight and use a broad-spectrum SPF 30 to 50 as advised.",
      "Contact the clinic promptly if you notice blistering, significant swelling, persistent pain, changes in pigmentation or another unexpected reaction."
    ],
    goodToKnow: [
      "It is normal to have some temporary redness, warmth, mild sensitivity or slight swelling around individual hair follicles after treatment, and treated hairs may shed gradually instead of disappearing immediately.",
      "Laser hair removal works best on hairs in their active growth phase, so a course of sessions is normally needed because not all hairs are in that phase at the same time.",
      "The number and spacing of sessions depends on the treatment area, hair colour and thickness, skin type, your hair growth cycle, hormonal influences, previous hair removal methods and how your skin responds, and your therapist will recommend a schedule after assessment.",
      "Your consultation and patch test will cover your medical history, current medication, skin conditions, previous laser or light-based treatments, recent tanning or sun exposure, your current hair removal routine and your treatment goals."
    ],
    notice: "Laser hair removal gives long-term hair reduction, not guaranteed permanent hair removal, and results, the number of sessions needed and maintenance requirements vary between individuals. All treatments are subject to consultation, patch testing where required and suitability assessment."
  },
  "laser-skin": {
    name: "Advanced Laser Skin Treatments",
    intro: "Our advanced laser skin treatments are designed to address a range of cosmetic skin concerns, using settings chosen for your skin. Treatment is never one size fits all, so every course begins with a consultation and skin assessment before a treatment plan is recommended.",
    suitableFor: "May suit clients concerned about uneven pigmentation, redness, signs of ageing or general skin quality, subject to consultation and suitability assessment.",
    notSuitableFor: "Not every concern suits laser treatment. If we believe laser is not appropriate for your particular concern, we will not proceed, and may suggest an alternative treatment or a medical assessment instead.",
    before: [
      "Avoid deliberate tanning and excessive sun exposure.",
      "Avoid fake tan on the treatment area.",
      "Temporarily stop certain active skincare products when advised.",
      "Avoid other potentially irritating treatments before your appointment.",
      "Tell us about any changes to your medication or health.",
      "Arrive with clean skin, without makeup, perfume or other products on the treatment area when requested."
    ],
    aftercare: [
      "Do not pick, scratch or peel treated skin.",
      "Keep the area clean and follow your recommended skincare routine.",
      "Avoid retinoids, exfoliating acids and harsh skincare until advised.",
      "Avoid excessive heat, saunas and steam rooms during the initial recovery period.",
      "Avoid direct sun exposure.",
      "Wear broad-spectrum SPF 30 to 50 daily.",
      "Avoid additional facial or aesthetic procedures until your skin has recovered.",
      "Contact the clinic if you notice significant blistering, increasing pain, prolonged swelling or a marked change in pigmentation."
    ],
    goodToKnow: [
      "Temporary effects after treatment can include redness, warmth, mild swelling, sensitivity, temporary darkening of treated pigment, or dryness and mild flaking, and more intensive procedures can mean more downtime.",
      "Your consultation may cover your skin type and tone, the specific concern, medical history, current medications, allergies, previous laser or light-based treatments, recent tanning or sun exposure, your current skincare and any previous aesthetic procedures.",
      "Available treatments and settings depend on the specific laser or light-based technology in use at the clinic."
    ],
    notice: "All laser treatments are subject to consultation, suitability assessment and patch testing where required. Available treatments depend on the specific laser or light-based technology used, and results, the number of sessions, downtime and maintenance requirements vary between individuals."
  },
  "tattoo-removal": {
    name: "Laser Tattoo and SPMU Removal",
    intro: "Laser tattoo and semi-permanent makeup removal works over a course of sessions, gradually fading the ink instead of removing it in one visit. Every course begins with a consultation and patch test to check the treatment is suitable for your skin and the ink involved.",
    suitableFor: "May suit clients wanting to fade or lighten an existing tattoo or semi-permanent makeup, subject to consultation and a patch test.",
    notSuitableFor: "Suitability depends on the ink, its depth and colour, and your skin. Treatment will only go ahead once your practitioner is satisfied it is appropriate.",
    before: [
      "Attend a consultation and patch test before your first session.",
      "Tell us about your medical history, current medication and any known allergies.",
      "Avoid sun exposure and tanning on the area before your appointment.",
      "Keep the area clean and free from makeup, creams or perfume before treatment."
    ],
    aftercare: [
      "Keep the treated area clean and dry as advised.",
      "Do not pick, scratch or peel the treated skin.",
      "Protect the area from the sun, and use SPF once healed.",
      "Avoid swimming, saunas and excessive heat while the area is healing.",
      "Contact the clinic if you notice blistering or another unexpected reaction."
    ],
    goodToKnow: [
      "Results and the number of sessions needed vary with the ink, its depth and your skin, so a course of sessions is normal, not a single visit.",
      "Sessions are usually spaced several weeks apart, to allow the skin and immune system to respond between treatments."
    ],
    notice: "No promise of complete removal can be made. Results, the number of sessions and healing time vary between individuals, and treatment is subject to consultation, patch testing and suitability assessment."
  },
  "consultations": {
    name: "Consultations",
    intro: "A consultation is your chance to discuss what you would like to achieve, have the relevant area assessed and ask questions before any decision is made about treatment.",
    suitableFor: "Suits anyone wanting professional advice before committing to a treatment, whether or not they go on to book it.",
    notSuitableFor: "A consultation carries no obligation to proceed. Treatment only goes ahead once your practitioner is satisfied it is appropriate and you are happy to continue.",
    before: [
      "Think about what you would like to discuss or achieve beforehand.",
      "Bring a list of any relevant medical conditions, medications or allergies.",
      "Bring reference photos if you have a particular look or result in mind."
    ],
    aftercare: [
      "There is no aftercare needed from the consultation itself.",
      "If you decide to go ahead with treatment, your practitioner will explain preparation and aftercare for that specific treatment.",
      "Take away any written advice or patch test instructions you are given."
    ],
    goodToKnow: [
      "A patch test may be arranged during your consultation if the treatment you are interested in requires one.",
      "Treatment is never guaranteed after a consultation. It goes ahead only when your practitioner is satisfied it is suitable for you."
    ],
    notice: "A consultation is for discussion and assessment only, and does not commit you or the clinic to a treatment being carried out."
  },
  "brows": {
    name: "Brow Treatments",
    intro: "Our brow treatments are personalised to your natural brow shape, facial features, hair growth and preferred finish. Options range from simple shaping to a fuller laminated look or added definition with tinting.",
    suitableFor: "Suits most clients wanting their natural brows professionally shaped, tinted or styled, following an assessment of your skin and brow hair.",
    notSuitableFor: "Certain treatments, such as lamination and tinting, may not suit very damaged brow hair, broken or irritated skin, or certain sensitivities, and a patch test may be needed first.",
    before: [
      "Arrive without heavy brow makeup where possible.",
      "Tell your therapist if you use retinoids, prescription acne treatments, exfoliating acids or other products that may increase skin sensitivity.",
      "Allow time for a patch test if one is required for tinting, lamination or another chemical treatment."
    ],
    aftercare: [
      "Avoid touching the treated area unnecessarily straight after treatment.",
      "Avoid excessive heat, steam and fragranced products around the treated area for the period advised.",
      "Avoid strong active skincare directly over the brows until advised.",
      "Temporary redness can occur after threading or waxing, and usually settles naturally."
    ],
    goodToKnow: [
      "A patch test may be required before tinting, lamination or other chemical brow treatments, in line with product manufacturer instructions.",
      "Treatment results and how long they last vary between individuals."
    ],
    notice: "Treatment results and longevity vary between individuals. Patch testing may be required for tinting, lamination and other chemical brow treatments, and all services are subject to consultation and suitability."
  },
  "lashes": {
    name: "Lash Treatments",
    intro: "Our lash treatments are personalised to your natural lashes, eye shape and preferred look, from a subtle natural enhancement to a more noticeable lifted, defined or extended finish.",
    suitableFor: "May suit clients wanting to enhance their natural lashes or add extensions, subject to consultation.",
    notSuitableFor: "Lash treatments may not be appropriate where there is an active eye infection, significant irritation or certain eye conditions, and suitability is assessed before treatment.",
    before: [
      "Arrive with clean lashes and minimal or no eye makeup where possible.",
      "Tell your therapist if you have sensitive eyes or known allergies.",
      "Tell your therapist if you have an active eye infection or irritation.",
      "Tell your therapist if you have recently had eye surgery or another eye procedure.",
      "Tell your therapist if you use medicated eye drops.",
      "Tell your therapist if you have previously reacted to lash tint, lifting or extension products."
    ],
    aftercare: [
      "Keep lashes dry as advised for the first 24 to 48 hours, or according to the specific product instructions.",
      "Avoid steam, saunas and excessive heat while your lashes settle.",
      "Avoid rubbing, pulling or picking at your lashes or extensions.",
      "Brush your lashes gently with a clean lash brush.",
      "Avoid oil-heavy products around the lashes where advised.",
      "Do not attempt to remove extensions yourself; have them professionally removed when required."
    ],
    goodToKnow: [
      "Natural lashes continually grow and shed, so losing some extensions between appointments is normal, and infill appointments help maintain fullness.",
      "A consultation and patch test may be required for lash lifting and tinting, in line with the products used.",
      "Treatment may need to be postponed or modified if there is an active eye condition."
    ],
    notice: "Treatment longevity and results vary according to natural lash growth, lifestyle and aftercare. Patch testing may be required for certain treatments or products, and all treatments are subject to consultation and suitability."
  },
  "spmu": {
    name: "Semi-Permanent Makeup",
    intro: "Semi-permanent makeup is a cosmetic tattoo procedure personalised to your facial features, natural colouring, skin type and preferences, for brows, lips or eyes. Every treatment begins with a detailed consultation covering your desired result, suitability, the healing process, aftercare and expected longevity.",
    suitableFor: "May suit clients wanting natural-looking brow, lip or eye definition without daily makeup, subject to consultation and suitability assessment.",
    notSuitableFor: "Treatment may need to be postponed, modified or avoided depending on individual circumstances. Tell us about any relevant medical conditions, medications, allergies, pregnancy or breastfeeding, active skin conditions, infections, recent surgery or procedures, blood-thinning medication, healing difficulties and previous reactions.",
    before: [
      "Attend a detailed consultation before treatment, covering your desired result, skin type, natural features, pigment selection, medical history and previous SPMU or cosmetic tattooing.",
      "A patch test will be completed where required, according to the products used and manufacturer instructions.",
      "Tell us about any medication, allergies or previous reactions."
    ],
    aftercare: [
      "Keep the treated area clean according to your practitioner's instructions.",
      "Avoid touching the area unnecessarily.",
      "Do not scratch, pick or peel any flaking or scabbing.",
      "Avoid applying makeup directly over the healing area until advised.",
      "Avoid swimming, saunas, steam rooms and excessive sweating during the initial healing period.",
      "Avoid strong skincare products, retinoids and exfoliating acids around the treatment area until fully healed.",
      "Avoid direct sun exposure and tanning; once healed, appropriate sun protection can help minimise premature pigment fading."
    ],
    goodToKnow: [
      "SPMU does not look the same immediately after treatment as it will once healed. Colour can appear darker or stronger at first, and mild redness, swelling, tenderness, dryness, flaking or light scabbing may occur before it softens during healing.",
      "SPMU is usually a multi-stage process. A perfecting or top-up session may be recommended once the initial area has fully healed, and further maintenance sessions may be needed over time as pigment gradually fades.",
      "How long SPMU lasts can be influenced by your skin type, the treatment technique, pigment selection, lifestyle, sun exposure, skincare products, your individual healing response, aftercare, and certain medications or aesthetic treatments."
    ],
    notice: "SPMU is a cosmetic tattoo procedure. Results, pigment retention, healing and longevity vary between individuals, and no healed result or duration can be guaranteed. Consultation and suitability assessment are required, and patch testing may be required depending on the products used."
  },
  "waxing": {
    name: "Face and Body Waxing",
    intro: "Our waxing treatments are delivered with care and attention to hygiene, and each service is tailored to your needs, from a quick facial wax to a full body treatment. Waxing removes hair from the root, giving longer-lasting smoothness than shaving.",
    suitableFor: "Suits many clients wanting temporary hair removal that lasts longer than shaving.",
    notSuitableFor: "Waxing may not be appropriate on irritated, broken, sunburnt or highly sensitised skin, and we may modify or postpone treatment where it could damage or irritate the skin.",
    before: [
      "Allow enough hair growth for the wax to grip effectively.",
      "Avoid shaving immediately before your appointment.",
      "Avoid excessive sun exposure or tanning before waxing.",
      "Avoid applying heavy oils or body lotions immediately before your appointment.",
      "Tell your therapist if you use retinoids or prescription acne medication, or strong exfoliating acids or other active skincare on the treatment area.",
      "Tell your therapist if you have recently had a chemical peel, laser or other resurfacing treatment.",
      "Tell your therapist about any allergies, highly sensitive skin, or broken, irritated, infected or sunburnt skin."
    ],
    aftercare: [
      "Avoid hot baths and very hot showers for the first 24 to 48 hours, or as advised.",
      "Avoid saunas, steam rooms and excessive heat.",
      "Avoid swimming while the skin remains sensitive.",
      "Avoid strenuous exercise if friction or sweating may irritate the area.",
      "Avoid sunbeds and excessive sun exposure.",
      "Avoid fragranced products, deodorants or strong skincare directly on freshly waxed areas where irritation could occur.",
      "Avoid tight clothing over sensitive freshly waxed areas.",
      "Do not scratch or excessively touch the skin."
    ],
    goodToKnow: [
      "Your skin may appear temporarily pink, red or slightly sensitive after waxing, and this usually settles naturally.",
      "Because waxing removes hair from the root, results generally last longer than shaving, and regular appointments can be scheduled around your hair growth cycle.",
      "Once the skin has settled, gentle regular exfoliation may help reduce the likelihood of ingrown hairs for some clients."
    ],
    notice: "Treatment suitability and results vary between individuals. All waxing services are subject to consultation and assessment of the treatment area, and temporary redness, sensitivity or occasional follicular irritation can occur following waxing."
  },
  "threading": {
    name: "Threading",
    intro: "Threading uses twisted cotton thread to precisely remove unwanted hairs and create a clean, defined shape. It is a chemical-free and wax-free method of hair removal.",
    suitableFor: "Suits many skin types and clients wanting precise hair removal by thread.",
    notSuitableFor: "Threading may not be suitable if the skin is particularly irritated, broken or sensitive; suitability is considered before treatment.",
    before: [
      "Arrive without heavy makeup over the area to be threaded.",
      "Tell your therapist if your skin is broken, irritated or unusually sensitive.",
      "Avoid strong active skincare on the area shortly before your appointment."
    ],
    aftercare: [
      "Temporary redness can occur after threading, and usually settles naturally.",
      "Avoid touching the area unnecessarily straight after treatment.",
      "Avoid heavy makeup on the area straight after treatment.",
      "Avoid excessive heat, steam and irritating skincare straight after treatment."
    ],
    goodToKnow: [
      "Threading removes hair from the root, including short, fine hairs, without wax or chemical depilatory products."
    ],
    notice: "Threading is not suitable for broken or very irritated skin, and suitability is assessed before treatment."
  },
  "makeup": {
    name: "Professional Makeup",
    intro: "Our makeup services are personalised to your skin tone, skin type, facial features, outfit and occasion, from a natural daytime look to full glamour or bridal makeup.",
    suitableFor: "Suits clients wanting professionally applied makeup for an event, occasion or their wedding day.",
    notSuitableFor: "If you have an active eye infection, significant skin irritation or another contagious skin or eye condition, your appointment may need to be postponed.",
    before: [
      "Arrive with a clean face where possible.",
      "Follow your normal gentle skincare routine beforehand.",
      "Avoid trying strong new skincare products immediately before an important event.",
      "Tell us about any allergies, sensitivities or known reactions to cosmetics or lash adhesives.",
      "Bring inspiration pictures if you have a particular look in mind.",
      "Bring a photograph of your outfit, jewellery or wedding styling if you would like the look coordinated."
    ],
    aftercare: [
      "Avoid unnecessarily touching or rubbing your face.",
      "Blot instead of rubbing if your skin becomes oily.",
      "Keep your chosen lip product to hand for touch-ups where needed.",
      "Avoid excessive moisture or steam where possible during your event.",
      "Remove your makeup thoroughly before sleeping, cleansing gently and removing eye makeup and lashes carefully.",
      "Never pull or force false lashes from the eyelid; remove them carefully using an appropriate method."
    ],
    goodToKnow: [
      "Makeup is applied using appropriate hygiene practices, including cleaning and sanitising tools between clients and using disposable applicators where appropriate.",
      "Tell your makeup artist about any allergies or sensitivities before application."
    ],
    notice: "Makeup results and wear time vary depending on skin type, environment, products, activity and aftercare. Please tell us about known allergies or sensitivities before treatment."
  },
  "bridal-hair": {
    name: "Bridal Hair Styling",
    intro: "Our bridal hair styling is personalised around you, your hair, your dress, your accessories and your vision for the day, from an elegant updo to soft waves or a style designed to complement a veil or headpiece.",
    suitableFor: "Suits brides wanting professional hair styling for their wedding, adapted to different hair textures, lengths and densities, including natural and chemically treated hair, wigs, hairpieces and extensions.",
    notSuitableFor: "Some requested styles depend on having enough length, density or suitable extensions. Your stylist will discuss what is realistically achievable with your hair during consultation or your trial.",
    before: [
      "Arrive with your hair prepared as instructed by your stylist.",
      "Avoid applying excessive oils or heavy styling products beforehand.",
      "Bring your veil, tiara and hair accessories.",
      "Bring any extensions or hairpieces you intend to use.",
      "Have inspiration photographs ready.",
      "Tell us about any scalp conditions, sensitivities, allergies or recent chemical hair treatments that may affect your service."
    ],
    aftercare: [
      "Avoid unnecessarily touching or repeatedly restyling your hair.",
      "Keep your hair protected from excessive moisture where possible.",
      "Take care when changing outfits or removing a veil.",
      "Do not pull tightly secured accessories from the hair.",
      "Remove pins and accessories gently at the end of your event.",
      "Carefully detangle your hair after removing the style.",
      "Remove extensions or hairpieces according to the recommended method."
    ],
    goodToKnow: [
      "A bridal trial is recommended for more complex styles, and gives your stylist time to understand your vision before the day.",
      "Final styling time and results depend on your hair length, texture, condition, chosen style, accessories and any extensions or hairpieces used."
    ],
    notice: "Final styling time and results depend on hair length, texture, condition, chosen style, accessories and any extensions or hairpieces used. Bridal trials are recommended for more complex styles."
  }
};
