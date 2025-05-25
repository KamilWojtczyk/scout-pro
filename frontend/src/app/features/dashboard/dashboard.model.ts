export interface Formation {
  name: string;
  positions: { [label: string]: { bottom: string; left: string } };
}

export const FORMATIONS: Formation[] = [
  {
    name: '4-3-3',
    positions: {
      GK: { bottom: '1%', left: '50%' },

      LB: { bottom: '17%', left: '18%' },
      LCB: { bottom: '15%', left: '40%' },
      RCB: { bottom: '15%', left: '60%' },
      RB: { bottom: '17%', left: '82%' },

      LCM: { bottom: '42%', left: '28%' },
      DM: { bottom: '30%', left: '50%' },
      RCM: { bottom: '42%', left: '72%' },

      LW: { bottom: '65%', left: '25%' },
      ST: { bottom: '70%', left: '50%' },
      RW: { bottom: '65%', left: '75%' },
    },
  },
  {
    name: '4-4-2',
    positions: {
      GK: { bottom: '1%', left: '50%' },

      LB: { bottom: '17%', left: '18%' },
      LCB: { bottom: '15%', left: '40%' },
      RCB: { bottom: '15%', left: '60%' },
      RB: { bottom: '17%', left: '82%' },

      LLM: { bottom: '48%', left: '18%' },
      LCM: { bottom: '43%', left: '40%' },
      RCM: { bottom: '43%', left: '60%' },
      RRM: { bottom: '48%', left: '82%' },

      LST: { bottom: '70%', left: '40%' },
      RST: { bottom: '70%', left: '60%' },
    },
  },
  {
    name: '3-5-2',
    positions: {
      GK: { bottom: '1%', left: '50%' },

      LCB: { bottom: '15%', left: '30%' },
      CB: { bottom: '15%', left: '50%' },
      RCB: { bottom: '15%', left: '70%' },

      LWB: { bottom: '46%', left: '12%' },
      LCM: { bottom: '42%', left: '30%' },
      CM: { bottom: '30%', left: '50%' },
      RCM: { bottom: '42%', left: '70%' },
      RWB: { bottom: '46%', left: '88%' },

      LST: { bottom: '70%', left: '40%' },
      RST: { bottom: '70%', left: '60%' },
    },
  },
];
