# Vibe Coding Navigator

Lietuviškas praktinis gidas, padedantis nuosekliai kurti programinę įrangą su AI: nuo problemos supratimo iki patikrinto paleidimo. Aštuoni etapai turi trumpą aprašymą, tris praktiškus patarimus, išsamų paaiškinimą ir pritaikomą užklausos arba kodo pavyzdį. Etapų pavadinimai `Idea`, `Prompt`, `Plan`, `Build`, `Review`, `Debug`, `Test`, `Ship` yra pastovūs sąsajos orientyrai; mokomasis turinys lietuviškas.

## Technologijos

- Spring Boot **3.5.16**, Spring MVC ir įterptasis Tomcat.
- Java **21** kompiliavimo taikinys (`--release 21`); projektą galima kompiliuoti ir paleisti su įdiegtu JDK 25.
- Thymeleaf serverio pusėje atvaizduojamam HTML, Jackson JSON atsakymams.
- Oficialus Apache Maven Wrapper **3.3.4** (`only-script`), Maven **3.9.16**. Globaliai įdiegto Maven nereikia.
- JUnit 5, AssertJ, Spring Boot Test ir MockMvc.
- Be duomenų bazės, paskyrų ar serverio pusėje saugomos pažangos. Node.js backendui nereikalingas.

## Paleidimas

Reikia JDK 21 arba naujesnio, `java` komandos per `PATH` arba tinkamo `JAVA_HOME`. Pirmas Wrapper paleidimas internetu atsisiunčia Maven ir projekto priklausomybes iš Maven Central.

Windows PowerShell projekto kataloge:

```powershell
.\mvnw.cmd spring-boot:run
```

Windows Command Prompt (`cmd.exe`) tame pačiame kataloge galima naudoti komandą:

```bat
mvnw.cmd spring-boot:run
```

Linux / macOS:

```sh
sh ./mvnw spring-boot:run
```

Atverk **http://localhost:8080**. Procesą sustabdo `Ctrl+C`. Prievadas nustatytas `application.properties`; prireikus jį galima pakeisti aplinkos kintamuoju `SERVER_PORT`.

## Adresai

| Metodas | Adresas | Rezultatas |
| --- | --- | --- |
| GET | `/` | Thymeleaf `index` vaizdas su modelio atributu `stages` |
| GET | `/api/stages` | HTTP 200 ir visų aštuonių etapų JSON masyvas, be papildomo apvalkalo |

HTML puslapiui reikalingas `src/main/resources/templates/index.html`. Šablonai ir statiniai failai kuriami atskirai; backend jų negeneruoja. API veikia nepriklausomai nuo šablono.

## Duomenų Sutartis

Paketas: `lt.vibecoding.navigator.model`. Tas pats `StageService.getStages()` sąrašas naudojamas HTML ir API. Sąrašas ir patarimai nekintami.

```java
public record Stage(
    int number,
    String slug,
    String title,
    String description,
    List<String> tips,
    String category,
    String categoryLabel,
    String detail,
    String example
) {}
```

| number | slug | title | category | categoryLabel |
| --- | --- | --- | --- | --- |
| 1 | `idea` | Idea | `discover` | Kryptis |
| 2 | `prompt` | Prompt | `discover` | Kryptis |
| 3 | `plan` | Plan | `discover` | Kryptis |
| 4 | `build` | Build | `create` | Kūrimas |
| 5 | `review` | Review | `validate` | Kokybė |
| 6 | `debug` | Debug | `validate` | Kokybė |
| 7 | `test` | Test | `validate` | Kokybė |
| 8 | `ship` | Ship | `deliver` | Paleidimas |

`tips` visada turi tris netuščius tekstus. `description` yra trumpas aprašymas, `detail` išsamiai paaiškina etapą, `example` pateikia praktišką pavyzdį. Visi tekstai yra paprastas UTF-8 tekstas, ne HTML ar Markdown. `example` gali turėti naujos eilutės simbolių. Šablone naudok `th:text`, naršyklėje `textContent`; eilučių išlaikymui tinka CSS `white-space: pre-wrap`. Nepaversk pavyzdžių vykdomu kodu ar nepatikrintu HTML.

## Struktūra

```text
pom.xml
mvnw / mvnw.cmd
.mvn/wrapper/maven-wrapper.properties
src/main/java/lt/vibecoding/navigator/
  NavigatorApplication.java
  model/Stage.java
  service/StageService.java
  controller/HomeController.java
  controller/StageController.java
src/main/resources/
  application.properties
  templates/index.html             # atskirai kuriamas frontend
  static/                          # atskirai kuriamas frontend
src/test/java/lt/vibecoding/navigator/
  service/StageServiceTest.java
  controller/HomeControllerTest.java
  controller/NavigatorEndpointsTest.java
```

## Testai

```powershell
.\mvnw.cmd test
.\mvnw.cmd clean verify
```

Unix aplinkoje atitinkamai naudok `sh ./mvnw test` arba `sh ./mvnw clean verify`.

- `StageServiceTest` tikrina tikslią etapų tvarką, kategorijas, turinio pilnumą ir nekintamumą.
- `HomeControllerTest` per MockMvc tikrina `/` valdiklio sutartį ir modelį nepriklausomai nuo frontend.
- `NavigatorEndpointsTest` su tikru Spring kontekstu tikrina JSON laukų sutartį, UTF-8 turinį ir atvaizduoja tikrą Thymeleaf šabloną. Kol `templates/index.html` nėra classpath, tik šablono testas praleidžiamas su aiškia priežastimi; jam atsiradus testas įsijungia automatiškai. Galutinei patikrai naudok `clean verify`, kad neliktų senų resursų.

Testai nepaleidžia ilgai veikiančio serverio ir neužima 8080 prievado. MockMvc nevykdo JavaScript: filtrus, klaviatūros valdymą, mobilų vaizdą ir pažangos išsaugojimą reikia papildomai patikrinti naršyklėje.

Supakuoto projekto paleidimas po sėkmingo `clean verify`:

```powershell
java -jar target/navigator-0.0.1-SNAPSHOT.jar
```

## Pažanga Naršyklėje

Frontend pažangai naudoja `localStorage`; backend teikia tik skaitomą etapų turinį ir neturi pažangos įrašymo API. Pažanga priklauso konkrečiai naršyklei ir svetainės origin (protokolui, domenui, prievadui), nesinchronizuoja tarp įrenginių ir prarandama išvalius svetainės duomenis. Tai nėra duomenų bazė ar atsarginė kopija. Saugyklos rakto ir būsenos formato valdymas priklauso frontend; serveris jų neprimeta. Frontend turėtų saugiai apdoroti neprieinamą saugyklą arba sugadintą JSON ir niekada nesaugoti joje paslapčių.
