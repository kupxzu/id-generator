export const id_cards = {
    index: () => '/id-cards',
    create: () => '/id-cards/create',
    store: () => '/id-cards',
    show: (id: number) => `/id-cards/${id}`,
    edit: (id: number) => `/id-cards/${id}/edit`,
    update: (id: number) => `/id-cards/${id}`,
    destroy: (id: number) => `/id-cards/${id}`,
};

export const id_templates = {
    index: () => '/id-cards/templates',
    update: (department: string) => `/id-cards/templates/${department}`,
};
