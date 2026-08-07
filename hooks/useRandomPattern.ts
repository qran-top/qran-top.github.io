import { useState, useEffect } from 'react';
import { useTheme } from './useTheme';

const patternTemplates = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><polygon fill='none' stroke='%%COLOR%%' stroke-opacity='%%OPACITY%%' stroke-width='1.5' points='50,10 65,35 90,50 65,65 50,90 35,65 10,50 35,35'/></svg>",
  "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g stroke='%%COLOR%%' stroke-opacity='%%OPACITY%%' stroke-width='1.2' fill='none'><polygon points='60,10 80,30 110,60 80,90 60,110 40,90 10,60 40,30'/><polygon points='60,30 75,45 90,60 75,75 60,90 45,75 30,60 45,45'/></g></svg>",
  "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><g stroke='%%COLOR%%' stroke-opacity='%%OPACITY%%' stroke-width='1.2' fill='none'><polygon points='70,10 90,30 130,70 90,110 70,130 50,110 10,70 50,30'/><line x1='70' y1='10' x2='70' y2='130'/><line x1='10' y1='70' x2='130' y2='70'/></g></svg>",
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><g stroke='%%COLOR%%' stroke-opacity='%%OPACITY%%' stroke-width='1' fill='none'><polygon points='80,20 100,40 140,80 100,120 80,140 60,120 20,80 60,40'/><polygon points='80,60 100,80 80,100 60,80'/></g></svg>",
  "<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'><g stroke='%%COLOR%%' stroke-opacity='%%OPACITY%%' stroke-width='2' fill='none'><path d='M0 15 H75 V90 M15 0 V75 H90'/><path d='M15 15 H60 V60 H15 Z'/></g></svg>",
  "<svg xmlns='http://www.w3.org/2000/svg' width='110' height='110' viewBox='0 0 110 110'><g stroke='%%COLOR%%' stroke-opacity='%%OPACITY%%' stroke-width='1.5' fill='none'><path d='M0 55 L55 0 L110 55 L55 110 Z M0 27.5 L27.5 0 M82.5 0 L110 27.5 M110 82.5 L82.5 110 M27.5 110 L0 82.5'/><path d='M0 55 H110 M55 0 V110'/></g></svg>",
  "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><g stroke='%%COLOR%%' stroke-opacity='%%OPACITY%%' stroke-width='2' fill='none'><path d='M0 25 H75 V100 M25 0 V75 H100'/><path d='M50 0 V100 M0 50 H100'/></g></svg>",
  "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><g stroke='%%COLOR%%' stroke-opacity='%%OPACITY%%' stroke-width='1.5' fill='none'><path d='M0 33 H66 V100 M33 0 V66 H100'/><path d='M33 33 H100 V100 H33 Z'/></g></svg>",
  "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g stroke='%%COLOR%%' stroke-opacity='%%OPACITY%%' stroke-width='1.2' fill='none'><path d='M0 60 L60 0 L120 60 L60 120 Z M0 40 L40 0 M80 0 L120 40 M120 80 L80 120 M40 120 L0 80'/><path d='M60 0 V120 M0 60 H120'/></g></svg>",
  "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><g stroke='%%COLOR%%' stroke-opacity='%%OPACITY%%' stroke-width='1.2' fill='none'><path d='M0 25 H75 V100 M25 0 V75 H100'/><path d='M25 25 H50 V50 H25 Z M50 50 H75 V75 H50 Z'/></g></svg>"
];

export const useRandomPattern = () => {
  const { theme } = useTheme();
  const [patternTemplate] = useState(() => patternTemplates[Math.floor(Math.random() * patternTemplates.length)]);
  const [patternStyle, setPatternStyle] = useState({});

  useEffect(() => {
    let color = '#000000';
    let opacity = 0.1;

    switch (theme) {
      case 'duha':
        color = '#2563eb';
        opacity = 0.08;
        break;
      case 'isha':
        color = '#d97706';
        opacity = 0.07;
        break;
      case 'dark':
        color = '#10b981';
        opacity = 0.08;
        break;
      case 'light':
      default:
        color = '#16a34a';
        opacity = 0.08;
        break;
    }
    
    const svgString = patternTemplate
      .replace(/%%COLOR%%/g, color)
      .replace(/%%OPACITY%%/g, String(opacity));

    const encodedSvg = encodeURIComponent(svgString);

    setPatternStyle({
      backgroundImage: `url("data:image/svg+xml,${encodedSvg}")`,
    });

  }, [theme, patternTemplate]);

  return patternStyle;
};