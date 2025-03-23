export namespace main {
	
	export class VideoFile {
	    name: string;
	    id: string;
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new VideoFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.id = source["id"];
	        this.path = source["path"];
	    }
	}

}

