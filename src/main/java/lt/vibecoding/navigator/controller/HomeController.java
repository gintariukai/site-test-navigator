package lt.vibecoding.navigator.controller;

import lt.vibecoding.navigator.service.StageService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    private final StageService stageService;

    public HomeController(StageService stageService) {
        this.stageService = stageService;
    }

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("stages", stageService.getStages());
        return "index";
    }
}
