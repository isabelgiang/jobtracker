import { StageInputs, ToStageInputs } from "../models/stage.model"
import { HttpException } from "../utils/error";

describe('ToStageInputs()', () => {
    const baseBody = {
        stageType: "Phone Screen",
        stageDate: "2021-06-10",
        durationMins: 60,
        notes: "Default notes"
    }
    const baseExpectedResult : StageInputs = {
        stageType: baseBody.stageType,
        stageDate: new Date(baseBody.stageDate),
        durationMins: baseBody.durationMins,
        notes: baseBody.notes
    }

    // Valid inputs
    it.each`
      bodyChanges           | expectedResultChanges | label
      ${{}}                 | ${{}}                 | ${"return expected results with default valid inputs"}
      ${{notes: " notes "}} | ${{notes: "notes"}}   | ${"trim notes with whitespace"}
      ${{notes: undefined}} | ${{notes: undefined}} | ${"accept undefined notes"}
      ${{notes: ""}}        | ${{notes: undefined}} | ${"accept empty string notes and convert to undefined"}
      ${{notes: null}}      | ${{notes: undefined}} | ${"accept null notes and convert to undefined"}
    `('should $label', ({bodyChanges, expectedResultChanges}) => {
        const body = { ...baseBody, ...bodyChanges }
        const expectedResult = { ...baseExpectedResult, ...expectedResultChanges }
        expect(ToStageInputs(body)).toEqual(expectedResult);
    });

    // Invalid inputs
    it.each`
      changes                      | label
      ${{stageType: "Invalid"}}    | ${"invalid stage type"}
      ${{stageType: ""}}           | ${"empty string stage type"}
      ${{stageType: undefined}}    | ${"undefined stage type"}
      ${{stageType: null}}         | ${"null stage type"}
      ${{stageDate: "string"}}     | ${"invalid date string"}
      ${{stageDate: ""}}           | ${"empty date string"}
      ${{stageDate: undefined}}    | ${"undefined date"}
      ${{stageDate: null}}         | ${"null date"}
      ${{durationMins: "string"}}  | ${"non-integer duration"}
      ${{durationMins: undefined}} | ${"undefined duration"}
      ${{durationMins: null}}      | ${"null duration"}
      ${{notes: 0}}                | ${"non-string notes"}
      ${{notes: " ".repeat(4001)}} | ${"notes longer than 4000 chars"}
    `('should throw HttpException with $label', ({changes}) => {
        const body = { ...baseBody, ...changes };
        expect(() => {
            ToStageInputs(body);
        }).toThrow(HttpException);
    });
});
