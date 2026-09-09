package lt.vibecoding.navigator.controller;

import java.util.List;

import lt.vibecoding.navigator.model.Stage;
import lt.vibecoding.navigator.service.StageService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StageController {

    private final StageService stageService;

    public StageController(StageService stageService) {
        this.stageService = stageService;
    }

    @GetMapping("/api/stages")
    public List<Stage> stages() {
        return stageService.getStages();
    }
}
