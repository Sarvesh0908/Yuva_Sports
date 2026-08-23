const onesMr = [
  '', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा',
  'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस', 'वीस',
  'एकवीस', 'बावीस', 'तेवीस', 'चोवीस', 'पंचवीस', 'सव्वीस', 'सत्तावीस', 'अठ्ठावीस', 'एकोणतीस', 'तीस',
  'एकतीस', 'बत्तीस', 'तेहेतीस', 'चौतीस', 'पस्तीस', 'छत्तीस', 'सदतीस', 'अडतीस', 'एकेचाळीस', 'चाळीस',
  'एक्केचाळीस', 'बेचाळीस', 'त्रेचाळीस', 'चव्वेचाळीस', 'पंचेचाळीस', 'शेहेचाळीस', 'सत्तेचाळीस', 'अठ्ठेचाळीस', 'एकोणपन्नास', 'पन्नास',
  'एक्कावन्न', 'बावन्न', 'त्रेपन्न', 'चौपन्न', 'पंचावन्न', 'छप्पन्न', 'सत्तावन्न', 'अठ्ठावन्न', 'एकोणसाठ', 'साठ',
  'एकसष्ट', 'पासष्ट', 'त्रेसष्ट', 'चौसष्ट', 'पासष्ट', 'सहासष्ट', 'सदुसष्ट', 'अडुसष्ट', 'एकोणसत्तर', 'सत्तर',
  'एक्काहत्तर', 'बाहत्तर', 'त्र्याहत्तर', 'चौर्‍याहत्तर', 'पंच्याहत्तर', 'शहात्तर', 'सत्त्याहत्तर', 'अठ्ठ्याहत्तर', 'एकोणऐंशी', 'ऐंशी',
  'एक्क्याऐंशी', 'ब्याऐंशी', 'त्र्याऐंशी', 'चौऱ्याऐंशी', 'पंच्याऐंशी', 'शहाऐंशी', 'सत्त्याऐंशी', 'अठ्ठ्याऐंशी', 'एकोणनव्वद', 'नव्वद',
  'एक्क्याण्णव', 'ब्याण्णव', 'त्र्याण्णव', 'चौऱ्याण्णव', 'पंच्याण्णव', 'शहाण्णव', 'सत्त्याण्णव', 'अठ्ठ्याण्णव', 'नव्व्याण्णव'
];

const onesEn = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];
const tensEn = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

export function numberToWordsMarathi(num) {
  num = Math.floor(Number(num) || 0);
  if (num === 0) return 'शून्य रुपये फक्त';

  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;
  const rest = num;

  if (crore > 0) {
    words += (onesMr[crore] || `${crore}`) + ' कोटी ';
  }
  if (lakh > 0) {
    words += (onesMr[lakh] || `${lakh}`) + ' लाख ';
  }
  if (thousand > 0) {
    words += (onesMr[thousand] || `${thousand}`) + ' हजार ';
  }
  if (hundred > 0) {
    words += (hundred === 1 ? 'एकशे' : (onesMr[hundred] || `${hundred}`) + 'शे') + ' ';
  }
  if (rest > 0) {
    words += (onesMr[rest] || `${rest}`) + ' ';
  }

  return words.trim() + ' रुपये फक्त';
}

export function numberToWordsEnglish(num) {
  num = Math.floor(Number(num) || 0);
  if (num === 0) return 'Zero Rupees Only';

  function convertLessThanThousand(n) {
    let str = '';
    if (n >= 100) {
      str += onesEn[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tensEn[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += onesEn[n] + ' ';
    }
    return str;
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const rest = num;

  if (crore > 0) {
    words += convertLessThanThousand(crore) + 'Crore ';
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + 'Lakh ';
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + 'Thousand ';
  }
  if (rest > 0) {
    words += convertLessThanThousand(rest);
  }

  return words.trim() + ' Rupees Only';
}
