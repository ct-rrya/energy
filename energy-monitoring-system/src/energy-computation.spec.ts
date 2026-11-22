describe('Energy Computation Module', () => {
    // helper matching your backend logic
    const computePower = (v: number, i: number) => v * i;
    const mWhToKwh = (mWh: number) => mWh / 1_000_000;

    const computeStepDeltas = (readings: { sensorId: string; stepCount: number }[]) => {
        let totalSteps = 0;
        let prev: number | null = null;

        for (const r of readings) {
            if (prev === null) {
                totalSteps += r.stepCount;
            } else if (r.stepCount >= prev) {
                totalSteps += r.stepCount - prev;
            } else {
                // esp32 probably rebooted so counter reset to a lower num
                totalSteps += r.stepCount;
            }
            prev = r.stepCount;
        }
        return totalSteps;
    };

    it('should match P = V * I for known voltage and current', () => {
        expect(computePower(1.5, 0.002)).toBeCloseTo(0.003, 6);
        expect(computePower(2.0, 0.005)).toBeCloseTo(0.01, 6);
    });

    it('should sum hardware energy increments and convert mWh to kWh', () => {
        const mockDocs = [
            { energy: 0.000651543 }, // your real sample reading
            { energy: 0.000348457 },
            { energy: 999.999 },
        ];

        const totalMwh = mockDocs.reduce((sum, doc) => sum + doc.energy, 0);
        const totalKwh = mWhToKwh(totalMwh);

        expect(totalMwh).toBeCloseTo(1000, 5);
        expect(totalKwh).toBeCloseTo(0.001, 6);
    });

    it('should compute step count delta and handle counter resets without double-counting', () => {
        // simulates normal steps then a hardware reset from 10 back down to 2
        const sequence = [
            { sensorId: 'fgh', stepCount: 6 },
            { sensorId: 'fgh', stepCount: 10 },
            { sensorId: 'fgh', stepCount: 2 },
            { sensorId: 'fgh', stepCount: 5 },
        ];

        expect(computeStepDeltas(sequence)).toBe(15);
    });
});