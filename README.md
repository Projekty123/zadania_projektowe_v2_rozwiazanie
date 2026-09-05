# Lista zadań w projekcie

## Opis projektu

„Lista zadań w projekcie” to aplikacja, która pozwala na tworzenie i organizowanie zadań. Każde zadanie ma swój tytuł, opis, osobę odpowiedzialną, priorytet, status oraz termin wykonania.

## Funkcje aplikacji

W aplikacji można:

* dodawać nowe zadania,
* edytować i usuwać zadania,
* usuwać wszystkie zadania,
* wyszukiwać zadania po tytule i osobie,
* filtrować zadania po statusie i priorytecie,
* zaznaczać kilka statusów i priorytetów jednocześnie,
* sortować zadania,
* dodawać, edytować i usuwać uwagi,
* klonować istniejące zadania,
* sprawdzać, które zadania są zaległe,
* wyświetlać zapisane dane w formacie JSON.

Aplikacja posiada również podsumowanie, w którym można zobaczyć liczbę wszystkich zadań oraz liczbę zadań w poszczególnych statusach i zadań zaległych.

## Uruchomienie

Do uruchomienia aplikacji nie jest potrzebny serwer ani dodatkowe programy.

Wystarczy otworzyć plik `index.html` w przeglądarce. Aplikacja korzysta z HTML, CSS i JavaScript oraz bibliotek Tailwind CSS, DaisyUI

## localStorage

Dane zadań są zapisywane w `localStorage` przeglądarki pod kluczem `project_tasks`.

Przy zapisywaniu dane są zamieniane na JSON za pomocą `JSON.stringify()`, a przy wczytywaniu ponownie zamieniane na obiekty JavaScript za pomocą `JSON.parse()`.

Dzięki temu zadania pozostają zapisane po odświeżeniu strony lub jej ponownym otwarciu w tej samej przeglądarce.

## Uwagi jako dane podrzędne

Każde zadanie może mieć własne uwagi. Są one zapisane w tablicy `uwagi`, która znajduje się wewnątrz konkretnego zadania.

Każda uwaga ma swoje `id`, treść oraz datę utworzenia. Dzięki temu można ją niezależnie edytować lub usunąć.

Przy klonowaniu zadania uwagi nie są kopiowane. Uznałam, że lepiej, aby nowe zadanie miało pustą listę uwag, ponieważ uwagi dotyczą konkretnego zadania.

## Sortowanie

Zadania można sortować na trzy sposoby:

* **Od najnowszych** – najnowsze zadania są na początku listy.
* **Od najstarszych** – najstarsze zadania są na początku listy.
* **Po nazwie alfabetycznie** – zadania są ułożone alfabetycznie według tytułu.

Do sortowania według daty wykorzystuję automatycznie dodawaną właściwość `data_dodania`. Jest ona zapisywana w momencie utworzenia zadania.

## Klonowanie zadania

Podczas edytowania zadania można użyć przycisku **Klonuj**. Tworzy on nowe zadanie na podstawie aktualnego zadania.

Klon otrzymuje nowe `id` oraz nową datę dodania, ale zachowuje pozostałe informacje, takie jak tytuł, opis, osoba, priorytet, status i termin. Uwagi nie są kopiowane.

Po sklonowaniu formularz pozostaje otwarty i można od razu edytować nowo utworzone zadanie.

## Czego się nauczyłam

Podczas tworzenia tego projektu nauczyłam się lepiej korzystać z JavaScriptu i pracy z DOM. Ćwiczyłam między innymi obsługę formularzy, przycisków i modalów oraz filtrowanie i sortowanie danych.

Dużo nauczyłam się również o pracy z tablicami i obiektami w JavaScript, w tym o tworzeniu danych podrzędnych, edytowaniu, usuwaniu i klonowaniu elementów.

Przy okazji ćwiczyłam korzystanie z Tailwind CSS i DaisyUI oraz tworzenie responsywnego interfejsu. Projekt pomógł mi też lepiej zrozumieć organizowanie kodu JavaScript i pracę z Gitem.
