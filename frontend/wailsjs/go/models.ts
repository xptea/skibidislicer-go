export namespace main {
	
	export class Settings {
	    watch_location: string;
	    save_location: string;
	    file_extension: string;
	    resolution: string;
	    codec: string;
	    bitrate: string;
	    copy_to_clipboard: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.watch_location = source["watch_location"];
	        this.save_location = source["save_location"];
	        this.file_extension = source["file_extension"];
	        this.resolution = source["resolution"];
	        this.codec = source["codec"];
	        this.bitrate = source["bitrate"];
	        this.copy_to_clipboard = source["copy_to_clipboard"];
	    }
	}
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

