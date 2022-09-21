import filesize from 'filesize';

const base2filesize = filesize.partial({ base: 2 });
export { base2filesize as filesize };
