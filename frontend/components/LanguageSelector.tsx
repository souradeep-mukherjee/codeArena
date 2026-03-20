import { SupportedLanguage } from '../services/api';

interface LanguageSelectorProps {
  value: SupportedLanguage;
  onChange: (value: SupportedLanguage) => void;
}

const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => {
  return (
    <label className="selector-wrap">
      <span>Language</span>
      <select value={value} onChange={(event) => onChange(event.target.value as SupportedLanguage)}>
        <option value="python">Python</option>
        <option value="javascript">JavaScript</option>
        <option value="c">C</option>
        <option value="cpp">C++</option>
      </select>
    </label>
  );
};

export default LanguageSelector;
