export namespace main {
	
	export interface VideoFile {
	    name: string;
	    id: string;
	    path: string;
	}

	export class VideoFileClass {
	    name: string;
	    thumbnail: string;
	
	    static createFrom(source: any = {}) {
	        return new VideoFileClass(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.thumbnail = source["thumbnail"];
	    }
	}

}

