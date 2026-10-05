-- The starting catalogue: three courses and four offers.
-- Prices are in US dollars. Tigrinya text is a first draft for Dleat to correct.

insert into public.courses (id, badge, title_en, title_ti, summary_en, summary_ti, description_en, description_ti, sort_order) values
(
  'premiere-pro', 'Pr', 'Adobe Premiere Pro', 'ኣዶቤ ፕሪሚየር ፕሮ',
  'Cut, trim and build a full edit, add titles and music, then export for YouTube and social media.',
  'ቪድዮ ቁረጽ፡ ኣዳልው፡ ጽሑፍን ሙዚቃን ወስኽ፡ ንዩቱብን ማሕበራዊ ሚድያን ኣውጽእ።',
  'Learn Premiere Pro the way it is taught in class at Segen Editing Academy. You start with importing footage and the timeline, then move on to cutting, transitions, titles, music and sound, colour, and exporting for YouTube, TikTok and Instagram. One new lesson opens every day for one month.',
  'ፕሪሚየር ፕሮ ልክዕ ከምቲ ኣብ ሰገን ኤዲቲንግ ኣካዳሚ ዝምሃር ተማሃር። ካብ ፉተጅ ምእታውን ታይምላይንን ጀሚርካ፡ ምቑራጽ፡ ትራንዚሽን፡ ጽሑፍ፡ ሙዚቃን ድምጽን፡ ሕብሪ፡ ከምኡ ድማ ንዩቱብ፡ ቲክቶክን ኢንስታግራምን ምውጻእ ትምሃር። ን ሓደ ወርሒ መዓልቲ መዓልቲ ሓድሽ ትምህርቲ ይኽፈት።',
  1
),
(
  'davinci-resolve', 'Dv', 'DaVinci Resolve', 'ዳቪንቺ ሪዞልቭ',
  'Edit on the cut page, colour grade your footage and clean up sound, all in free software.',
  'ቪድዮ ኣርትዕ፡ ሕብሪ ኣመሓይሽ፡ ድምጺ ኣጽሪ፡ ብነጻ ሶፍትዌር።',
  'DaVinci Resolve is free and used on real films. This course covers the cut and edit pages, colour grading, Fairlight sound and delivering your finished video. One new lesson opens every day for one month.',
  'ዳቪንቺ ሪዞልቭ ነጻ እዩ፡ ኣብ ሓቀኛ ፊልምታት ድማ ይጥቀሙሉ። እዚ ኮርስ ናይ ምቑራጽን ምርታዕን ገጻት፡ ሕብሪ ምምሕያሽ፡ ድምጺ ከምኡ ድማ ዝተወደአ ቪድዮ ምውጻእ ይሸፍን። ን ሓደ ወርሒ መዓልቲ መዓልቲ ሓድሽ ትምህርቲ ይኽፈት።',
  2
),
(
  'photoshop', 'Ps', 'Adobe Photoshop', 'ኣዶቤ ፎቶሾፕ',
  'Design thumbnails, posters and social posts, and retouch photos with layers and masks.',
  'ታምብኔይል፡ ፖስተርን ፖስትን ስራሕ፡ ስእልታት ብሌየርን ማስክን ኣመሓይሽ።',
  'Photoshop for video editors and designers: layers, selections and masks, retouching, text and effects, and designing thumbnails and posters that get clicks. One new lesson opens every day for one month.',
  'ፎቶሾፕ ንቪድዮ ኤዲተራትን ዲዛይነራትን፦ ሌየር፡ ምምራጽን ማስክን፡ ስእሊ ምምሕያሽ፡ ጽሑፍን ኢፌክትን፡ ከምኡ ድማ ዝስሕቡ ታምብኔይላትን ፖስተራትን ምድላው። ን ሓደ ወርሒ መዓልቲ መዓልቲ ሓድሽ ትምህርቲ ይኽፈት።',
  3
);

insert into public.offers (id, title_en, title_ti, price_usd, sort_order) values
  ('premiere-pro', 'Adobe Premiere Pro', 'ኣዶቤ ፕሪሚየር ፕሮ', 100, 1),
  ('davinci-resolve', 'DaVinci Resolve', 'ዳቪንቺ ሪዞልቭ', 100, 2),
  ('photoshop', 'Adobe Photoshop', 'ኣዶቤ ፎቶሾፕ', 100, 3),
  ('premiere-photoshop', 'Premiere Pro + Photoshop', 'ፕሪሚየር ፕሮ + ፎቶሾፕ', 150, 4);

insert into public.offer_courses (offer_id, course_id) values
  ('premiere-pro', 'premiere-pro'),
  ('davinci-resolve', 'davinci-resolve'),
  ('photoshop', 'photoshop'),
  ('premiere-photoshop', 'premiere-pro'),
  ('premiere-photoshop', 'photoshop');
