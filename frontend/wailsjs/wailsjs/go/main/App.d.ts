// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {main} from '../models';

export function CopyToClipboard(arg1:string):Promise<void>;

export function CropVideo(arg1:string,arg2:number,arg3:number,arg4:number,arg5:number):Promise<string>;

export function ExportClip(arg1:string,arg2:string,arg3:number,arg4:number,arg5:string,arg6:string,arg7:string,arg8:string):Promise<string>;

export function FetchDirectory():Promise<string>;

export function GetExportSettings():Promise<main.Settings>;

export function GetLatestVideos(arg1:string):Promise<Array<main.VideoFile>>;

export function GetSaveLocation():Promise<string>;

export function GetThumbnail(arg1:string):Promise<Array<number>>;

export function GetWatchLocation():Promise<string>;

export function HandleFileUpload(arg1:Array<number>,arg2:string):Promise<string>;

export function SaveExportSettings(arg1:Record<string, any>):Promise<void>;

export function SaveSaveLocation(arg1:string):Promise<void>;

export function SaveWatchLocation(arg1:string):Promise<void>;

export function SelectVideo():Promise<string>;
