import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { supabase } from "../supabaseClient";

export default function LanguageSelector({ userId }) {
  const { i18n } = useTranslation();
  const [selected, setSelected] = useState(i18n.language || 'en');

  useEffect(() => {
    // Load language from Supabase profile
    const loadLang = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', userId)
        .single();

      if (data?.language) {
        setSelected(data.language);
        i18n.changeLanguage(data.language);
      }
    };

    if (userId) loadLang();
  }, [userId, i18n]);

  const handleChange = async (e) => {
    const lang = e.target.value;
    setSelected(lang);
    i18n.changeLanguage(lang);

    // Save to profile
    await supabase
      .from('profiles')
      .update({ language: lang })
      .eq('id', userId);
  };

  return (
    <select value={selected} onChange={handleChange} className="p-2 rounded text-black"> {/* Added text-black for visibility */}
      <option value="en">English</option>
      <option value="is">Íslenska</option>
    </select>
  );
}
