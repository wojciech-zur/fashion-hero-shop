# New Seller Boost - opis funkcjonalny dla testerów

## Cel funkcjonalności

New Seller Boost to płatny pakiet promocyjny dla nowych sprzedających w FashionHero.  
Pakiet zwiększa widoczność ofert sprzedającego na stronach kategorii przez ograniczony czas.

## Najważniejsze zasady biznesowe

- Cena pakietu: **49 zl**
- Czas trwania: **7 dni**
- Limit ofert w promocji: **maksymalnie 10**
- Aktywacja: **tylko raz na konto sprzedającego**
- Dostępność: tylko dla sprzedających, którzy mają **do 20 ofert** w momencie aktywacji
- Informacja o rozliczeniu: opłata jest dopisywana do faktury FashionHero

## Główny flow użytkownika (seller)

1. Użytkownik loguje się standardowo do konta (`/account`).
2. Na dashboardzie konta wybiera przycisk **Go to seller dashboard**.
3. Trafia na ekran wyboru profilu sprzedającego (ekran testowy z oznaczeniem DEBUG).
4. Po wyborze przechodzi do `/account/seller`.
5. Jeśli sprzedający spełnia warunki, widzi baner New Seller Boost i może kliknąć aktywację.
6. Po aktywacji:
   - może zaznaczać/odznaczać oferty do promocji,
   - widzi licznik wybranych ofert,
   - klika **Apply changes**, aby zapisać zmiany,
   - widzi sekcję statystyk boosta: `promo views`, `promo clicks`, `promo sold`.
7. Po zapisaniu zmian pojawia się komunikat potwierdzający, ile ofert jest aktualnie promowanych.

## Zachowanie listy ofert na seller dashboard

- Lista ofert sprzedającego jest widoczna zawsze (także przed aktywacją pakietu).
- Każdy wiersz pokazuje:
  - miniaturę produktu,
  - nazwę produktu,
  - cenę,
  - przycisk **Edit price**.
- Opcje związane z boostem pojawiają się dopiero po aktywacji pakietu.
- Zmiany zaznaczeń nie są publikowane automatycznie - publikacja następuje po **Apply changes**.

## Co widzi kupujący (buyer)

- Na stronach kategorii pojawia się dodatkowa karuzela promowanych ofert.
- Karuzela zawiera tylko aktywnie promowane oferty z bieżącej kategorii.
- Kolejność ofert jest losowa.
- Karuzela ma strzałki do przewijania.

## Wygaśnięcie pakietu

- Po 7 dniach pakiet wygasa.
- Po wygaśnięciu:
  - promocja ofert przestaje działać,
  - nie można ponownie aktywować pakietu na tym samym koncie,
  - opcje związane z aktywnym boostem oraz statystyki nie są dostępne.

## Tryb DEBUG (na potrzeby testów)

### Ekran wyboru sellera
- Jest oznaczony jako DEBUG i służy tylko do testowania.
- W produkcyjnym flow sprzedający byłby przypisany do konta bez ręcznego wyboru.

### Przyciski debugowe w banerze New Seller Boost

- Widoczne tylko w określonych stanach:
  - **DEBUG: expire** - tylko gdy boost jest aktywny
  - **DEBUG: deactivate** - tylko gdy boost jest aktywny
  - **DEBUG: restore** - tylko gdy boost jest nieaktywny po wykorzystaniu
- Cel:
  - szybkie sprawdzenie scenariuszy końca promocji i zachowania UI po wygaśnięciu
  - reset stanu do ponownych testów

## Co testować manualnie (checklista)

1. Wejście z `/account` do seller dashboard przez przycisk.
2. Widoczność banera tylko dla sprzedających spełniających warunki.
3. Aktywacja pakietu i poprawny stan po aktywacji.
4. Zaznaczanie/odznaczanie ofert i poprawne działanie **Apply changes**.
5. Komunikat po zapisie zmian.
6. Pojawienie się ofert w karuzeli kategorii po zapisaniu.
7. Działanie strzałek karuzeli.
8. Scenariusz wygaśnięcia i brak możliwości ponownej aktywacji.
9. Zachowanie przycisków DEBUG dla aktywnego i przeterminowanego stanu.
10. Widoczność i aktualizacja wszystkich 3 KPI (`promo views`, `promo clicks`, `promo sold`) dla wybranego sellera.
