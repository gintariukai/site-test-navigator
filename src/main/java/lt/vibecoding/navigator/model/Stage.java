package lt.vibecoding.navigator.model;

import java.util.List;

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
) {
    public Stage {
        tips = List.copyOf(tips);
    }
}
