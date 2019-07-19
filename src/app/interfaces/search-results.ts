export interface Match {
    text: string;
    indices: [number, number];
}

export interface TextMatch {
    object_url: string;
    object_type: string;
    property: string;
    fragment: string;
    matches: Match[];
}

export interface User {
    login: string;
    avatar_url: string;
    html_url: string;
    url: string;
    type: string;
    text_matches?: TextMatch[];
}

export interface SearchResults {
    total_count: number;
    incomplete_results: boolean;
    items: User[];
}
