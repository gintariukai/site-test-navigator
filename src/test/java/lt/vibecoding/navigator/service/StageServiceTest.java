package lt.vibecoding.navigator.service;

import java.util.ArrayList;
import java.util.List;

import lt.vibecoding.navigator.model.Stage;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

class StageServiceTest {

    private final StageService service = new StageService();

    @Test
    void providesEightOrderedStagesWithExactCategories() {
        assertThat(service.getStages())
                .extracting(Stage::number, Stage::slug, Stage::title, Stage::category, Stage::categoryLabel)
                .containsExactly(
                        tuple(1, "idea", "Idea", "discover", "Kryptis"),
                        tuple(2, "prompt", "Prompt", "discover", "Kryptis"),
                        tuple(3, "plan", "Plan", "discover", "Kryptis"),
                        tuple(4, "build", "Build", "create", "Kūrimas"),
                        tuple(5, "review", "Review", "validate", "Kokybė"),
                        tuple(6, "debug", "Debug", "validate", "Kokybė"),
                        tuple(7, "test", "Test", "validate", "Kokybė"),
                        tuple(8, "ship", "Ship", "deliver", "Paleidimas")
                );
    }

    @Test
    void everyStageHasCompletePracticalContent() {
        assertThat(service.getStages()).extracting(Stage::slug).doesNotHaveDuplicates();
        assertThat(service.getStages()).allSatisfy(stage -> {
            assertThat(stage.description()).isNotBlank();
            assertThat(stage.tips()).hasSize(3).doesNotHaveDuplicates();
            assertThat(stage.tips()).allSatisfy(tip -> assertThat(tip).isNotBlank());
            assertThat(stage.detail()).hasSizeGreaterThan(300);
            assertThat(stage.example()).hasSizeGreaterThan(150);
        });
    }

    @Test
    void sharedContentAndRecordTipsCannotBeMutated() {
        assertThatThrownBy(() -> service.getStages().clear())
                .isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> service.getStages().getFirst().tips().clear())
                .isInstanceOf(UnsupportedOperationException.class);

        List<String> originalTips = new ArrayList<>(List.of("Patarimas"));
        Stage stage = new Stage(1, "idea", "Idea", "Aprašymas", originalTips,
                "discover", "Kryptis", "Detalės", "Pavyzdys");
        originalTips.clear();
        assertThat(stage.tips()).containsExactly("Patarimas");
    }
}
