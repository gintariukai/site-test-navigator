package lt.vibecoding.navigator.service;

import java.util.List;

import lt.vibecoding.navigator.model.Stage;
import org.springframework.stereotype.Service;

@Service
public class StageService {

    private final List<Stage> stages = List.of(
            new Stage(
                    1, "idea", "Idea",
                    "Pradėk nuo žmogaus problemos, o ne nuo technologijos. Aiškiai įvardyk, kam ir kuo padėsi.",
                    List.of(
                            "Aprašyk vieną konkretų naudotoją, jo situaciją ir šiandien naudojamą sprendimą.",
                            "Pasirink vieną pagrindinį veiksmą, kurį pirmoji versija turi leisti atlikti iki galo.",
                            "Užrašyk pamatuojamą sėkmės kriterijų ir bent tris dalykus, kurių dabar nekursi."
                    ),
                    "discover", "Kryptis",
                    "Gera idėja prasideda nuo aiškaus poreikio: kas stringa, kam tai svarbu ir kaip žmogus sprendžia problemą dabar. "
                            + "Pasikalbėk su būsimu naudotoju arba stebėk jo darbą. Atskirai užrašyk patvirtintus faktus ir savo prielaidas. "
                            + "Pirmąją versiją apribok vienu naudingu scenarijumi, kad galėtum greitai patikrinti vertę, o ne kurti funkcijų kolekciją. "
                            + "Į kitą etapą pereik turėdamas trumpą problemos aprašą, aiškias ribas ir patikrinamą sėkmės kriterijų.",
                    "Padėk patikslinti idėją: kuriu mokymosi etapų navigatorių pradedančiajam programuotojui. "
                            + "Problema: jis nežino, ką daryti po pirmo AI sugeneruoto kodo. "
                            + "Pirma versija turi parodyti 8 etapus ir leisti naršyklėje pažymėti pažangą. "
                            + "Sėkmė: žmogus per 2 minutes randa kitą veiksmą. Nekuriame paskyrų, mokėjimų ir bendradarbiavimo. "
                            + "Užduok 5 klausimus apie nepatikrintas prielaidas; dar nesiūlyk kodo."
            ),
            new Stage(
                    2, "prompt", "Prompt",
                    "Paversk sumanymą aiškia užduotimi AI: duok kontekstą, ribas ir patikrinamą rezultatą.",
                    List.of(
                            "Nurodyk technologijas, svarbius failus ir esamą elgesį, kurio negalima sugadinti.",
                            "Apibrėžk laukiamą rezultatą bei priėmimo kriterijus, o ne vien prašyk padaryti gražiai.",
                            "Paprašyk prieš keičiant kodą įvardyti trūkstamą informaciją; niekada nesiųsk paslapčių."
                    ),
                    "discover", "Kryptis",
                    "AI nemato tavo ketinimų, jei jų neparašei. Naudingoje užklausoje yra tikslas, projekto kontekstas, "
                            + "apribojimai ir būdas patikrinti atsakymą. Pateik mažiausią reikalingą kodo ištrauką ar klaidos pranešimą, "
                            + "pašalinęs prieigos raktus ir asmens duomenis. Didelę užduotį skaidyk į mažesnius, patikrinamus pakeitimus. "
                            + "Jei reikalavimas neaiškus, prašyk klausimų, o ne spėlionių. Geras rezultatas yra ne ilgas atsakymas, "
                            + "bet pakeitimas, kurį gali suprasti ir patikrinti pagal iš anksto sutartus kriterijus.",
                    "Kontekstas: Spring Boot 3.5, Java 21, Thymeleaf, be duomenų bazės. "
                            + "Tikslas: GET /api/stages turi grąžinti 8 mokymosi etapus JSON formatu. "
                            + "Naudok Stage įrašą ir StageService, išlaikyk etapų tvarką. "
                            + "Neliesk templates ir static katalogų. Priėmimas: HTTP 200, 8 elementai, "
                            + "numeriai nuo 1 iki 8, kiekvienas etapas turi 3 patarimus. "
                            + "Pirmiausia perskaityk esamą kodą, tada įgyvendink mažiausią pakeitimą ir pridėk MockMvc testą."
            ),
            new Stage(
                    3, "plan", "Plan",
                    "Suskaidyk darbą į mažus žingsnius ir iš anksto sutark, kaip patikrinsi kiekvieną rezultatą.",
                    List.of(
                            "Pradėk nuo duomenų sutarties: laukų pavadinimų, tipų, adresų ir galimų klaidų.",
                            "Išdėliok priklausomybes: modelis, turinys, valdikliai, sąsaja, tada galutinė patikra.",
                            "Kiekvienam žingsniui priskirk baigtumo kriterijų ir rizikingiausią prielaidą tikrink pirmą."
                    ),
                    "discover", "Kryptis",
                    "Planas padeda išvengti situacijos, kai atskirai veikiantys komponentai nesusijungia. "
                            + "Sutark, iš kur ateina duomenys, kokia jų forma ir kuri dalis atsakinga už būseną. "
                            + "Rinkis mažus vertikalius pjūvius: vienas realus scenarijus nuo užklausos iki matomo rezultato "
                            + "yra vertingesnis už daug neužbaigtų sluoksnių. Pažymėk rizikas, pavyzdžiui, nežinomą biblioteką "
                            + "ar neaiškų naršyklės elgesį, ir numatyk trumpą bandymą joms patikrinti. Planą atnaujink pagal faktus, "
                            + "bet nepridėk naujų funkcijų vien todėl, kad jas lengva sugeneruoti.",
                    "Sudaryk 5 žingsnių planą mokymosi navigatoriui. Sutartis: GET / grąžina index su stages; "
                            + "GET /api/stages grąžina tą patį sąrašą; pažanga saugoma tik localStorage. "
                            + "Kiekvienam žingsniui nurodyk keičiamus failus, priklausomybę ir patikrą. "
                            + "Pirmas pjūvis: vienas etapas iš serviso pasiekia šabloną. "
                            + "Baigtumo kriterijus: visi 8 etapai matomi, filtrai veikia, po puslapio perkrovimo pažanga išlieka."
            ),
            new Stage(
                    4, "build", "Build",
                    "Kurk mažais pakeitimais: paleisk, patikrink ir tik tada pridėk kitą elgesį.",
                    List.of(
                            "Vienu pakeitimu įgyvendink vieną scenarijų ir iškart patikrink kompiliavimą bei testus.",
                            "Laikyk duomenis servise, HTTP logiką valdiklyje, o vaizdavimą šablone.",
                            "Po kiekvieno AI pasiūlymo peržiūrėk diff ir pašalink nereikalingas priklausomybes."
                    ),
                    "create", "Kūrimas",
                    "Įgyvendink mažiausią veikiančią versiją pagal sutartą planą. Pradėk nuo aiškaus modelio ir "
                            + "vieno veikiančio kelio iki naudotojo, tada plėsk turinį bei sąveikas. Nekopijuok nesuprasto kodo: "
                            + "paprašyk paaiškinti svarbų sprendimą ir patikrink bibliotekos dokumentaciją. "
                            + "Nekintantį turinį laikyk vienoje vietoje, kad HTML ir API nerodytų skirtingų duomenų. "
                            + "Dažnai kompiliuok ir vykdyk testus; taip klaidą susiesi su mažu, lengvai peržiūrimu pakeitimu. "
                            + "Veikiantis paprastas sprendimas yra geresnis už abstrakcijas ateičiai, kurios dabar neturi vartotojo.",
                    "Įgyvendink tik etapų sąrašo gavimą. Valdiklio metodas:\n\n"
                            + "@GetMapping(\"/api/stages\")\n"
                            + "public List<Stage> stages() {\n"
                            + "    return stageService.getStages();\n"
                            + "}\n\n"
                            + "Metodas priklauso @RestController klasei; StageService perduodamas per konstruktorių. "
                            + "Po pakeitimo vykdyk .\\mvnw.cmd test ir patikrink, kad nepridėjai duomenų bazės ar naujų API laukų."
            ),
            new Stage(
                    5, "review", "Review",
                    "Peržiūrėk ne tik ar kodas veikia, bet ir ar jis suprantamas, saugus bei atitinka užduotį.",
                    List.of(
                            "Skaityk git diff ir tikrink pakeitimus pagal priėmimo kriterijus, ne pagal AI pasitikėjimą.",
                            "Ieškok jautrių duomenų, nepatikrintos įvesties, nesaugaus HTML ir bereikalingų priklausomybių.",
                            "Paprašyk pastabas pateikti su failu, eilute, realiu klaidos scenarijumi ir siūloma patikra."
                    ),
                    "validate", "Kokybė",
                    "Kodo peržiūra yra nepriklausoma patikra, o ne sugeneruoto atsakymo patvirtinimas. "
                            + "Palygink pakeitimą su reikalavimais ir patikrink, ar jis nesugadino esamo elgesio. "
                            + "Atkreipk dėmesį į atsakomybių ribas, klaidų apdorojimą, prieinamumą ir turinio koduotę. "
                            + "Tekstą šablone rodyk saugiai, pavyzdžiui, per th:text, o ne kaip nepatikimą HTML. "
                            + "AI pastabas laikyk hipotezėmis: svarbias išvadas patvirtink kodu arba testu. "
                            + "Pirmiausia taisyk klaidas ir saugumo rizikas, tik po to kosmetiką; nekeisk nesusijusio kodo.",
                    "Peržiūrėk šį git diff kaip kodo recenzentas. Prioritetai: neteisingas elgesys, "
                            + "regresijos, XSS rizika ir trūkstami testai. Patikrink, ar API ir šablonas naudoja tą patį StageService. "
                            + "Kiekvienai išvadai pateik svarbą, failą bei eilutę, atkūrimo scenarijų ir minimalų taisymą. "
                            + "Jei problema tik numanoma, aiškiai tai pažymėk. Kodo kol kas nekeisk."
            ),
            new Stage(
                    6, "debug", "Debug",
                    "Atkurk klaidą, surink įrodymus ir taisyk priežastį, o ne vien matomą simptomą.",
                    List.of(
                            "Užrašyk tikslius atkūrimo žingsnius, tikėtiną rezultatą ir tai, kas įvyko iš tikrųjų.",
                            "Patikrink naršyklės Console bei Network ir serverio klaidos grandinės pirmą reikšmingą priežastį.",
                            "Tikrink po vieną hipotezę ir pridėk testą, kuris prieš taisymą atkuria klaidą."
                    ),
                    "validate", "Kokybė",
                    "Pradėk nuo pakartojamo scenarijaus, o ne atsitiktinių kodo pakeitimų. Atskirk, ar problema "
                            + "kyla naršyklėje, HTTP užklausoje, valdiklyje ar šablono apdorojime. Surink tik reikalingus "
                            + "žurnalų įrašus, užklausos duomenis ir paskutinį susijusį pakeitimą; pašalink paslaptis. "
                            + "Suformuluok vieną priežasties hipotezę ir mažiausią eksperimentą jai patikrinti. "
                            + "Neužmaskuok problemos tuščiu catch bloku ar visų patikrų išjungimu. "
                            + "Radęs priežastį, parašyk regresinį testą ir patikrink gretimus scenarijus.",
                    "Klaida: GET / grąžina 500, bet GET /api/stages grąžina 200 ir 8 etapus. "
                            + "Žurnale: Error resolving template [index]. Tikėtina: matomas navigatorius. "
                            + "Padėk patikrinti, ar src/main/resources/templates/index.html egzistuoja, "
                            + "ar pateko į target/classes/templates ir ar valdiklis grąžina tiksliai index. "
                            + "Pasiūlyk vieną patikrą kiekvienai hipotezei. Nekeisk veikiančio API ir neslėpk 500 klaidos."
            ),
            new Stage(
                    7, "test", "Test",
                    "Įrodyk, kad svarbūs scenarijai veikia: tikrink duomenis, HTTP atsakymus ir tikrą naudotojo kelią.",
                    List.of(
                            "Serviso testu tikrink 8 etapų tvarką, unikalius slugus, kategorijas ir po 3 patarimus.",
                            "MockMvc testais tikrink API JSON sutartį ir tikrą pagrindinio šablono atvaizdavimą.",
                            "Naršyklėje išbandyk mobilų ekraną, klaviatūrą, filtrus ir pažangą po puslapio perkrovimo."
                    ),
                    "validate", "Kokybė",
                    "Automatiniai testai turi saugoti elgesį, kurį pažadėjai naudotojui. Serviso testai greitai "
                            + "patikrina turinio vientisumą, o HTTP testai aptinka valdiklių, JSON ir šablonų sujungimo klaidas. "
                            + "Tikrink ne tik sėkmingą kelią: apsvarstyk tuščią paiešką, nerastą adresą ir sugadintą naršyklės saugyklą. "
                            + "MockMvc nevykdo JavaScript, todėl filtrus ir localStorage papildomai tikrink naršyklėje arba "
                            + "visos sistemos testais. Užrašyk, kas patikrinta automatiškai, kas rankiniu būdu ir kas dar lieka nepatikrinta. "
                            + "Vien žalias kompiliavimas neįrodo, kad naudotojo scenarijus veikia.",
                    "Automatinė patikra: .\\mvnw.cmd test\n\n"
                            + "MockMvc API patikros pavyzdys:\n"
                            + "mockMvc.perform(get(\"/api/stages\"))\n"
                            + "    .andExpect(status().isOk())\n"
                            + "    .andExpect(jsonPath(\"$.length()\").value(8))\n"
                            + "    .andExpect(jsonPath(\"$[0].slug\").value(\"idea\"));\n\n"
                            + "Rankinis scenarijus: pažymėk etapą, perkrauk puslapį ir įsitikink, kad pažanga išliko. "
                            + "Tada išvalyk localStorage ir patikrink pradinę būseną."
            ),
            new Stage(
                    8, "ship", "Ship",
                    "Paleisk patikrintą versiją, patikrink ją tikroje aplinkoje ir pasiruošk grįžti atgal.",
                    List.of(
                            "Prieš leidimą vykdyk švarų build, peržiūrėk konfigūraciją ir įsitikink, kad nėra paslapčių.",
                            "Po paleidimo patikrink pagrindinį puslapį, API, statinius failus ir serverio žurnalus.",
                            "Išsaugok ankstesnį veikiantį artefaktą, užrašyk grąžinimo veiksmus ir surink naudotojų atsiliepimus."
                    ),
                    "deliver", "Paleidimas",
                    "Paleidimas yra atskiras darbas, ne paskutinis kodo išsaugojimas. Sukurk patikrintą artefaktą "
                            + "ir aprašyk reikalingą Java versiją, prievadą bei konfigūraciją. Viešai aplinkai pasirūpink HTTPS, "
                            + "tinkamomis prieigos taisyklėmis ir žurnalų stebėjimu. Iškart po diegimo atlik trumpą veikimo patikrą "
                            + "su realiu adresu, nes vietiniai testai neaptinka visų aplinkos skirtumų. Šiame projekte nėra duomenų bazės: "
                            + "naršyklės pažanga nėra paskyra ar atsarginė kopija ir nesinchronizuoja tarp įrenginių. "
                            + "Turėk aiškų būdą grąžinti ankstesnę versiją ir kitus pakeitimus planuok pagal realų grįžtamąjį ryšį.",
                    "Windows leidimo patikra:\n"
                            + ".\\mvnw.cmd clean verify\n"
                            + "java -jar target/navigator-0.0.1-SNAPSHOT.jar\n\n"
                            + "Kitoje konsolėje: curl.exe -i http://localhost:8080/api/stages\n"
                            + "Naršyklėje atverk http://localhost:8080 ir patikrink visus 8 etapus. "
                            + "Užrašyk artefakto versiją ir patikros rezultatą. Jei pagrindinis scenarijus neveikia, "
                            + "sustabdyk naują procesą ir paleisk ankstesnį patikrintą JAR."
            )
    );

    public List<Stage> getStages() {
        return stages;
    }
}
