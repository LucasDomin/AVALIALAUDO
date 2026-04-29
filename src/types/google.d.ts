interface Window {
  google: {
    accounts: {
      id: {
        initialize: (config: { client_id: string; callback: (res: { credential: string }) => void }) => void;
        renderButton: (el: HTMLElement | null, options: object) => void;
        prompt: () => void;
      };
    };
  };
}