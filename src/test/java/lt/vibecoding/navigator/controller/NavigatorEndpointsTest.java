package lt.vibecoding.navigator.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lt.vibecoding.navigator.model.Stage;
import lt.vibecoding.navigator.service.StageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

@SpringBootTest
@AutoConfigureMockMvc
class NavigatorEndpointsTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StageService stageService;

    @Test
    void apiReturnsTheExactStageContractAndLithuanianContent() throws Exception {
        String json = mockMvc.perform(get("/api/stages"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(8))
                .andExpect(jsonPath("$[0].slug").value("idea"))
                .andExpect(jsonPath("$[7].slug").value("ship"))
                .andExpect(jsonPath("$[3].categoryLabel").value("Kūrimas"))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        for (JsonNode stage : objectMapper.readTree(json)) {
            assertThat(stage.properties()).extracting(entry -> entry.getKey())
                    .containsExactlyInAnyOrder("number", "slug", "title", "description", "tips",
                            "category", "categoryLabel", "detail", "example");
        }
        List<Stage> response = objectMapper.readValue(json, new TypeReference<List<Stage>>() { });
        assertThat(response).containsExactlyElementsOf(stageService.getStages());
    }

    @Test
    void homeRendersTheRealThymeleafTemplateWhenAvailable() throws Exception {
        assumeTrue(new ClassPathResource("templates/index.html").exists(),
                "Frontend index.html is not available yet; the controller contract is tested separately.");

        String html = mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(view().name("index"))
                .andExpect(model().attribute("stages", stageService.getStages()))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        assertThat(html).contains("<html").doesNotContain("th:each=", "th:text=", "${stage.");
        for (Stage stage : stageService.getStages()) {
            assertThat(html).contains(stage.title(), stage.description());
        }
    }
}
