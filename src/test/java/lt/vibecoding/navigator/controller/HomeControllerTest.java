package lt.vibecoding.navigator.controller;

import lt.vibecoding.navigator.service.StageService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

class HomeControllerTest {

    @Test
    void homeExposesStagesToIndexWithoutRequiringTheFrontend() throws Exception {
        StageService service = new StageService();
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new HomeController(service))
                .setSingleView((model, request, response) -> { })
                .build();

        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(view().name("index"))
                .andExpect(model().attribute("stages", service.getStages()));
    }
}
