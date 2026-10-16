# Réponse à Apple (refus 2.1 « Information Needed », 16 oct. 2026)

À coller deux fois : en réponse dans App Store Connect (Vérification de l'app) ET dans
« Informations de vérification de l'app > Notes ». Joindre la vidéo à la réponse.

---

Hello,

Thank you for your review. Here is the requested information. A screen recording made on a physical iPhone is attached.

**1. Screen recording**
Attached. It starts with the app launch and shows: onboarding (body shape questions), taking a photo of yourself, choosing a garment, the AI try-on result, the "Delete all my data" flow, and the subscription screen (title, length and price of each plan, Terms of Use and Privacy Policy links).

**2. Purpose and audience**
Akalie is a virtual fitting room for people aged 15 and over (younger users are blocked during onboarding) who shop for clothes online. The user takes one photo of themself, then picks a garment (photo, product link, or shared from a shopping app). The app shows that garment worn on the user's own photo, and gives styling advice based on their body shape. It answers the question "will this piece suit me?" before buying, which reduces bad purchases and returns.

**3. How to access the main features**
No login or credentials are needed. The app creates an anonymous session on first launch.
- Answer the short onboarding questions to get a body shape profile.
- Take or choose a photo of yourself.
- On the "Essayer" tab (first tab), add a garment (a photo, a product link, or an item from the "Inspirations" tab) and tap "M'essayer ce vêtement".
- The AI image appears after about 1 to 2 minutes and is labeled "Créée par IA". The first 2 try-ons are free; the subscription screen appears after that.
- Account and data deletion: "Essayer" tab, link "Supprimer toutes mes données" at the bottom (deletes the photos, profile and history from our servers, then the session).
Note: the interface is in French.

**4. External services**
- Supabase: database, file storage, anonymous authentication, server functions.
- Kie.ai (reseller of OpenAI GPT Image): generates the try-on image.
- Anthropic (Claude): recognizes garments and checks that the content is allowed (no lingerie, swimwear, see-through clothing or nudity; filter applied before and after generation).
- RevenueCat with Apple In-App Purchase: subscriptions.
- SerpApi (Google Shopping results): public product listings shown in "Inspirations", each linking to the merchant's page.

**5. Regional differences**
The app works the same in all regions. The interface is in French only, and the product suggestions come from French online shops.

**6. Regulated industry / third-party material**
The app does not operate in a regulated industry. Product images in "Inspirations" come from public shopping search results and always link to the merchant's own product page. We remove any item at the merchant's request. User photos stay private: they are never shown to other users, and there is no public or shared content in the app.

**7. In-App Purchases**
One subscription group, "Akalie Premium", with two auto-renewable plans that unlock AI try-ons:
- Premium mensuel: €9.99 per month.
- Premium annuel: €59.99 per year.
Where to find them: after the 2 free try-ons, the subscription screen opens automatically. It is also available from the offer card on the "Essayer" tab. The screen shows the title, length and price of each plan, plus Restore Purchases, Terms of Use (Apple standard EULA) and Privacy Policy (https://akalie.app/confidentialite-app) links.

Best regards,
Aurélien Branco
contact@madaria.fr
