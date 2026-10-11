import path from 'node:path';
import {existsSync} from 'node:fs';

/** Resolve native tools without mixing a Windows runtime with a Linux process. */
export function resolveRuntime({root,platform=process.platform,environ=process.env,exists=existsSync}){
 const paths=platform==='win32'?path.win32:path.posix;
 const delimiter=platform==='win32'?';':':';
 const runtimeRoot=environ.HDLBITS_RUNTIME_ROOT||paths.join(root,'.tools',platform==='win32'?'ucrt64':'linux/runtime');
 const bin=paths.join(runtimeRoot,'bin'),lib=paths.join(runtimeRoot,'lib','ivl');
 const suffix=platform==='win32'?'.exe':'';
 const bundled=exists(paths.join(bin,'iverilog'+suffix))&&exists(paths.join(bin,'vvp'+suffix));
 const compiler=environ.IVERILOG_PATH||(bundled?paths.join(bin,'iverilog'+suffix):'iverilog');
 const runtime=environ.VVP_PATH||(bundled?paths.join(bin,'vvp'+suffix):'vvp');
 const compilerArgs=bundled&&!environ.IVERILOG_PATH?['-B',lib]:[];
 const runtimeArgs=bundled&&!environ.VVP_PATH?['-M',lib]:[];
 const env={...environ};
 if(bundled){
  env.PATH=[bin,environ.PATH].filter(Boolean).join(delimiter);
  if(platform==='linux')env.LD_LIBRARY_PATH=[paths.join(runtimeRoot,'lib','native'),environ.LD_LIBRARY_PATH].filter(Boolean).join(':');
 }
 return {runtimeRoot,bundled,compiler,runtime,compilerArgs,runtimeArgs,env};
}
