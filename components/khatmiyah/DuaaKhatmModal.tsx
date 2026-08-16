import React from 'react';
import { ClearIcon, CheckIcon } from '../icons';

interface DuaaKhatmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DUAA_TEXT = `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ

اللَّهُمَّ ارْحَمْنَا بِالقُرْآنِ، وَاجْعَلْهُ لَنَا إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً.
اللَّهُمَّ ذَكِّرْنَا مِنْهُ مَا نَسِينَا، وَعَلِّمْنَا مِنْهُ مَا جَهِلْنَا، وَارْزُقْنَا تِلاَوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ، وَاجْعَلْهُ لَنَا حُجَّةً يَا رَبَّ العَالَمِينَ.

اللَّهُمَّ أَصْلِحْ لَنَا دِينَنَا الَّذِي هُوَ عِصْمَةُ أَمْرِنَا، وَأَصْلِحْ لَنَا دُنْيَانَا الَّتِي فِيهَا مَعَاشُنَا، وَأَصْلِحْ لَنَا آخِرَتَنَا الَّتِي فِيهَا مَعَادُنَا، وَاجْعَلِ الحَيَاةَ زِيَادَةً لَنَا فِي كُلِّ خَيْرٍ، وَاجْعَلِ المَوْتَ رَاحَةً لَنَا مِنْ كُلِّ شَرٍّ.

اللَّهُمَّ اجْعَلْ خَيْرَ أَعْمَارِنَا أَوَاخِرَهَا، وَخَيْرَ أَعْمَالِنَا خَوَاتِمَهَا، وَخَيْرَ أَيَّامِنَا يَوْمَ نَلْقَاكَ فِيهِ.
اللَّهُمَّ إِنَّا نَسْأَلُكَ عِيشَةً هَنِيَّةً، وَمِيتَةً سَوِيَّةً، وَمَرَدًّا غَيْرَ مُخْزٍ وَلاَ فَاضِحٍ.

اللَّهُمَّ تَقَبَّلْ مِنَّا هَذِهِ الخَتْمَةَ المُبَارَكَةَ، وَاجْعَلْ ثَوَابَهَا نُورًا يَسْعَى بَيْنَ أَيْدِينَا وَبِأَيْمَانِنَا، وَاغْفِرْ لَنَا وَلِوَالِدِينَا وَلِمَنْ شَارَكَ فِيهَا، وَلِجَمِيعِ المُسْلِمِينَ وَالمُسْلِمَاتِ الأَحْيَاءِ مِنْهُمْ وَالأَمْوَاتِ.

وَصَلَّى اللَّهُ وَسَلَّمَ وَبَارَكَ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ، وَالحَمْدُ لِلَّهِ رَبِّ العَالَمِينَ.`;

const DuaaKhatmModal: React.FC<DuaaKhatmModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-surface border border-border-default rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-border-default flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤲</span>
            <h2 className="text-xl font-bold text-text-primary">دعاء ختم القرآن الكريم</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-surface transition-colors"
            aria-label="إغلاق"
          >
            <ClearIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-center leading-loose font-amiri text-lg sm:text-xl text-text-primary bg-surface selection:bg-primary/20">
          <p className="whitespace-pre-line text-justify leading-[2.2]">{DUAA_TEXT}</p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-default bg-surface-subtle flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <CheckIcon className="w-5 h-5" />
            تقبّل الله منّا ومنكم صالح الأعمال
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuaaKhatmModal;
