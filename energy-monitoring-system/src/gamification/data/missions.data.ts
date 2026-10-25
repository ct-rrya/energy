export interface QuizQuestionInternal {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-indexed, strictly confidential on backend
  explanation: string;
}

export interface QuizQuestionPublic {
  id: string;
  question: string;
  options: string[];
}

export interface MissionLessonSection {
  title: string;
  content: string;
}

export interface MissionDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  estimatedMinutes: number;
  xpReward: number;
  isActive: boolean;
  sections: MissionLessonSection[];
  questions: QuizQuestionInternal[];
}

export const EDUCATIONAL_MISSIONS: MissionDefinition[] = [
  {
    id: 'mission_piezo_intro',
    title: 'Introduction to Piezoelectricity',
    subtitle: 'From mechanical force to electrical charge',
    description:
      'Discover how pressure and mechanical deformation on specialized crystal lattices generate electrical energy without combustion or rotating turbines.',
    estimatedMinutes: 5,
    xpReward: 50,
    isActive: true,
    sections: [
      {
        title: '1. What is the Piezoelectric Effect?',
        content:
          'The piezoelectric effect is the generation of electric charge in certain solid materials in response to applied mechanical stress. The word "piezo" originates from the Greek *piezein*, meaning to squeeze or press. Discovered in 1880 by French physicists Jacques and Pierre Curie, this physical phenomenon occurs in crystals that lack a center of inversion symmetry, such as quartz, Rochelle salt, and specialized ceramics.',
      },
      {
        title: '2. Microscopic Mechanism: Dipoles & Charge Separation',
        content:
          'In an unstressed piezoelectric material, positive and negative ions within the crystal unit cell are evenly distributed, so their dipole moments cancel each other out. When mechanical pressure compresses or twists the crystal lattice, the internal ions shift. This physical displacement creates net electric dipole moments across the material, causing opposite electrical charges to accumulate on opposing surfaces and generating a measurable voltage potential.',
      },
      {
        title: '3. Direct vs. Inverse Piezoelectricity',
        content:
          'Piezoelectricity is a reversible physical process. The **direct effect** occurs when mechanical force produces an electrical charge—this is how EcoStep generates power from footsteps. The **inverse effect** occurs when applying an electrical voltage causes the material to physically deform or vibrate—a principle widely utilized in quartz watches, ultrasound transducers, and acoustic speakers.',
      },
      {
        title: '4. Materials Used in Energy Harvesting Tiles',
        content:
          'Modern floor harvesting systems primarily utilize synthetic polycrystalline ferroelectric ceramics, notably Lead Zirconate Titanate (PZT) or lead-free alternatives like Barium Titanate. These ceramics undergo a manufacturing process known as "poling," where strong external electric fields align their ferroelectric domains, maximizing their sensitivity and energy conversion efficiency under foot traffic.',
      },
    ],
    questions: [
      {
        id: 'q_piezo_1',
        question: 'What physical input causes a piezoelectric material to generate electrical charge?',
        options: [
          'Direct exposure to sunlight',
          'Applied mechanical stress or pressure',
          'Chemical reactions with air',
          'Static ambient magnetic fields',
        ],
        correctAnswerIndex: 1,
        explanation:
          'Piezoelectricity generates electrical charge directly from applied mechanical stress or compression on non-centrosymmetric materials.',
      },
      {
        id: 'q_piezo_2',
        question: 'Who discovered the piezoelectric effect in 1880?',
        options: [
          'Nikola Tesla and Thomas Edison',
          'Michael Faraday and James Clerk Maxwell',
          'Jacques and Pierre Curie',
          'Albert Einstein and Max Planck',
        ],
        correctAnswerIndex: 2,
        explanation:
          'French physicists Jacques and Pierre Curie discovered the piezoelectric effect in 1880 while studying quartz and tourmaline crystals.',
      },
      {
        id: 'q_piezo_3',
        question: 'What occurs at the atomic/molecular level when a piezoelectric material is compressed?',
        options: [
          'Electrons escape into the atmosphere',
          'Ions in the crystal lattice shift, creating electric dipole moments',
          'The material completely loses its chemical bonds',
          'The crystal becomes radioactive',
        ],
        correctAnswerIndex: 1,
        explanation:
          'Mechanical pressure displaces positive and negative ions in the non-centrosymmetric unit cell, separating charges and creating net electric dipoles.',
      },
      {
        id: 'q_piezo_4',
        question: 'What is the "inverse piezoelectric effect"?',
        options: [
          'Generating power by freezing the material',
          'Physical deformation of the material when an electrical voltage is applied',
          'Reversing the magnetic poles with a magnet',
          'Converting sound directly into light',
        ],
        correctAnswerIndex: 1,
        explanation:
          'The inverse piezoelectric effect occurs when an applied electric voltage causes the material to expand, contract, or vibrate.',
      },
      {
        id: 'q_piezo_5',
        question: 'Why are synthetic ceramics like PZT frequently chosen for energy harvesting tiles?',
        options: [
          'They are completely liquid at room temperature',
          'They produce infinite energy without any physical input',
          'They exhibit high electromechanical coupling after high-voltage poling',
          'They are made entirely of pure copper wires',
        ],
        correctAnswerIndex: 2,
        explanation:
          'Synthetic ferroelectric ceramics like PZT offer high electromechanical coupling coefficients and robust durability under repetitive footstep cycles.',
      },
    ],
  },
  {
    id: 'mission_v_i_p_e',
    title: 'Understanding Voltage, Current, Power & Energy',
    subtitle: 'Deciphering electrical metrics with clarity',
    description:
      'Master the core electrical measurements monitored on the EcoStep dashboard and learn the essential difference between instantaneous power (mW) and accumulated energy (mWh).',
    estimatedMinutes: 6,
    xpReward: 60,
    isActive: true,
    sections: [
      {
        title: '1. Voltage (V) — The Driving Potential',
        content:
          'Voltage, measured in Volts (V) or millivolts (mV), represents the electrical potential difference between two points. It is the "pressure" that drives electrical charges through a circuit. When a pedestrian steps on an EcoStep tile, the sudden mechanical compression can produce momentary voltage spikes ranging from a few volts to several tens of volts before regulation.',
      },
      {
        title: '2. Current (I) — The Rate of Charge Flow',
        content:
          'Electric current, measured in Amperes (A) or milliamperes (mA), is the rate at which electrical charge flows through a conductor ($I = Q / t$). One ampere corresponds to one coulomb of electric charge flowing past a given point per second. While piezoelectric tiles can produce relatively high voltage spikes, the instantaneous current delivered per step is typically in the milliampere or microampere range.',
      },
      {
        title: '3. Instantaneous Power (P = V × I)',
        content:
          'Power is the instantaneous rate at which electrical energy is generated or consumed ($P = V \\times I$), measured in Watts (W) or milliwatts (mW, where $1\\text{ W} = 1{,}000\\text{ mW}$). On the EcoStep dashboard, the "Real-Time Power" card reflects this instantaneous output at each exact moment. When someone is actively stepping, power spikes upward; when the tiles are unoccupied, power returns toward zero.',
      },
      {
        title: '4. Harvested Energy (E = Power × Time)',
        content:
          'Energy represents the total work performed over an extended duration, calculated by integrating power over time ($E = \\int P \\, dt$). Common units include milliwatt-hours (mWh) and Watt-hours (Wh, where $1\\text{ Wh} = 1{,}000\\text{ mWh}$). Unlike instantaneous power, energy is **cumulative**: even when power drops to zero between steps, the total energy harvested today or across a lifetime never decreases.',
      },
    ],
    questions: [
      {
        id: 'q_vipe_1',
        question: 'What does Voltage (V) physically represent in an electrical circuit?',
        options: [
          'The total volume of copper in a cable',
          'The electrical potential difference that drives charge flow',
          'The total time a battery has been manufactured',
          'The physical weight of the solar panel',
        ],
        correctAnswerIndex: 1,
        explanation:
          'Voltage is the electric potential difference between two conductors, providing the driving force that pushes electric charge through a circuit.',
      },
      {
        id: 'q_vipe_2',
        question: 'Which formula represents the relationship between electrical power (P), voltage (V), and current (I)?',
        options: [
          'P = V × I',
          'P = V / I',
          'P = V + I',
          'P = V² × I²',
        ],
        correctAnswerIndex: 0,
        explanation:
          'Electric power is the product of voltage and current: P = V × I (Watts = Volts × Amperes).',
      },
      {
        id: 'q_vipe_3',
        question: 'What is the crucial difference between Power (mW) and Energy (mWh)?',
        options: [
          'Power is cumulative over time, while Energy is instantaneous',
          'Power and Energy are identical physical quantities with different spellings',
          'Power is the instantaneous rate of energy generation, while Energy is the total work accumulated over time',
          'Energy only exists in batteries, while power only exists in power lines',
        ],
        correctAnswerIndex: 2,
        explanation:
          'Power (mW) measures the instantaneous generation rate at a single moment, whereas Energy (mWh) accumulates total power delivered over a duration of time.',
      },
      {
        id: 'q_vipe_4',
        question: 'If a sensor tile delivers 10 milliwatts (mW) steadily for 2 hours, how much electrical energy was harvested?',
        options: [
          '5 mWh',
          '12 mWh',
          '20 mWh',
          '200 mWh',
        ],
        correctAnswerIndex: 2,
        explanation:
          'Energy = Power × Time = 10 mW × 2 hours = 20 mWh.',
      },
      {
        id: 'q_vipe_5',
        question: 'When no footsteps are touching the tile for 10 minutes, what happens to the Lifetime Harvested Energy displayed on EcoStep?',
        options: [
          'It drops back to zero immediately',
          'It decreases at a rate of 50% per minute',
          'It remains preserved because cumulative energy does not decrease when idle',
          'It becomes negative until another step occurs',
        ],
        correctAnswerIndex: 2,
        explanation:
          'Cumulative energy accounts for total past work harvested. When the system is idle, power is zero but accumulated energy remains intact.',
      },
    ],
  },
  {
    id: 'mission_ecostep_harvesting',
    title: 'How EcoStep Harvests Footstep Energy',
    subtitle: 'From human kinetics to IoT intelligence',
    description:
      'Trace the complete hardware and software pipeline of EcoStep: mechanical transmission, AC rectification, voltage regulation, capacitor storage, and IoT cloud telemetry.',
    estimatedMinutes: 7,
    xpReward: 75,
    isActive: true,
    sections: [
      {
        title: '1. Tile Mechanical Architecture',
        content:
          'Each EcoStep harvesting tile consists of a high-durability surface plate supported by a spring-guided suspension mechanism. When a pedestrian steps on the tile, mechanical force is uniformly distributed across an array of piezoelectric discs housed securely beneath the plate. The suspension springs reset the tile surface smoothly after the foot departs.',
      },
      {
        title: '2. AC to DC Rectification',
        content:
          'Because mechanical compression and subsequent release push and pull charges in opposite directions, the raw output from a piezoelectric transducer is Alternating Current (AC). Sensitive electronics and microcontrollers require stable Direct Current (DC). EcoStep routes the transducer signals through low-forward-drop Schottky diode bridge rectifiers, converting bidirectional AC spikes into unidirectional positive DC pulses.',
      },
      {
        title: '3. Voltage Regulation & Energy Buffering',
        content:
          'Raw rectified piezoelectric pulses feature high voltage peaks with short pulse durations. EcoStep integrates buck converter power-management stages that step down high voltages to standard levels (e.g., 3.3V or 5V) while maximizing charge transfer into high-capacity low-leakage supercapacitors or lithium-ion storage buffers.',
      },
      {
        title: '4. IoT Microcontroller & Real-Time Telemetry',
        content:
          'An integrated low-power IoT node (ESP32) equipped with precision analog-to-digital converters (ADC) continuously samples the harvested voltage and current across known load resistors. The onboard firmware computes footstep counts and electrical metrics, transmitting telemetry packets to the backend server in real time via secure WebSocket and REST streams.',
      },
    ],
    questions: [
      {
        id: 'q_step_1',
        question: 'Why does raw electrical output from piezoelectric tiles require rectification?',
        options: [
          'Because the electricity is too cold for electronics',
          'Because piezoelectric compression and release generate Alternating Current (AC), but electronics require Direct Current (DC)',
          'To convert electrical energy into liquid fuel',
          'To slow down light particles inside the copper wiring',
        ],
        correctAnswerIndex: 1,
        explanation:
          'Piezoelectric pulses alternate in polarity during pressure and release cycles (AC), which must be rectified into unidirectional Direct Current (DC) to power electronic circuits.',
      },
      {
        id: 'q_step_2',
        question: 'What electronic component circuit is used in EcoStep to convert AC pulses into DC?',
        options: [
          'A full-wave diode bridge rectifier',
          'An induction motor',
          'A mechanical relay switch',
          'A heating filament',
        ],
        correctAnswerIndex: 0,
        explanation:
          'A full-wave bridge rectifier using low-loss diodes converts bidirectional AC waveforms into positive DC output.',
      },
      {
        id: 'q_step_3',
        question: 'Where is harvested electrical charge buffered before powering sensors and IoT telemetry?',
        options: [
          'In wooden panels',
          'In supercapacitors or rechargeable energy storage buffers',
          'Directly into household AC wall sockets without converters',
          'In chemical combustion chambers',
        ],
        correctAnswerIndex: 1,
        explanation:
          'Supercapacitors and rechargeable battery buffers store small, intermittent charge pulses and release them steadily to power monitoring microcontrollers.',
      },
      {
        id: 'q_step_4',
        question: 'Which IoT microcontroller is used in EcoStep to sample electrical measurements and send telemetry?',
        options: [
          'A vacuum tube mainframe',
          'An ESP32 microcontroller with integrated ADC and wireless communication',
          'A mechanical typewriter',
          'An analog audio tape recorder',
        ],
        correctAnswerIndex: 1,
        explanation:
          'EcoStep employs the low-power ESP32 microcontroller equipped with analog-to-digital converters to monitor metrics and transmit data over WiFi/WebSockets.',
      },
      {
        id: 'q_step_5',
        question: 'What is the role of the spring-guided suspension beneath the EcoStep top plate?',
        options: [
          'To generate heat through friction',
          'To evenly distribute pedestrian impact force and safely reset the tile surface for the next footstep',
          'To permanently lock the tile downward after one single step',
          'To bounce pedestrians into the air',
        ],
        correctAnswerIndex: 1,
        explanation:
          'The suspension system distributes mechanical load across the transducer array and resets the tile smoothly to capture energy from subsequent foot traffic.',
      },
    ],
  },
];

/**
 * Strips answer keys and confidential explanations from missions for public consumption.
 */
export function sanitizeMissionForPublic(
  mission: MissionDefinition,
  isCompleted = false,
  bestScore?: number,
) {
  return {
    id: mission.id,
    title: mission.title,
    subtitle: mission.subtitle,
    description: mission.description,
    estimatedMinutes: mission.estimatedMinutes,
    xpReward: mission.xpReward,
    isActive: mission.isActive,
    sections: mission.sections,
    questionCount: mission.questions.length,
    questions: mission.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    })),
    isCompleted,
    bestScore: bestScore ?? null,
  };
}
