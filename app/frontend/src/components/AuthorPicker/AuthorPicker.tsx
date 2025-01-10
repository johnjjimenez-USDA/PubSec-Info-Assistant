// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { useState, useEffect } from 'react';
import { TagPicker, ITag, IBasePickerSuggestionsProps} from '@fluentui/react/lib/Pickers';
import { TooltipHost,
  ITooltipHostStyles} from "@fluentui/react";
import { Info16Regular } from '@fluentui/react-icons';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { useId } from '@fluentui/react-hooks';
import { getAllAuthors } from "../../api";

import styles from "./AuthorPicker.module.css";

var allowAddNew = false;

interface Props {
    allowNewAuthors?: boolean;
    onSelectedAuthorsChange: (selectedAuthors: ITag[]) => void;
    preSelectedAuthors?: ITag[];
    hide?: boolean;
}

export const AuthorPickerInline = ({allowNewAuthors, onSelectedAuthorsChange, preSelectedAuthors, hide}: Props) => {

    const pickerId = useId('author-inline-picker');
    const tooltipId = useId('authorpicker-tooltip');
    const hostStyles: Partial<ITooltipHostStyles> = { root: { display: 'inline-block' } };
    const newItem = mergeStyles({ color: '#f00', background: '#ddf', padding: '10px' });
    const existingItem = mergeStyles({ color: '#222', padding: '10px' });

    const [selectedAuthors, setSelectedAuthors] = useState<ITag[]>([]);
    const [authors, setAuthors] = useState<ITag[]>([]);
    const getTextFromItem = (item: ITag) => item.name;

    allowAddNew = allowNewAuthors as boolean;

    const listContainsAuthorList = (author: ITag, authorList?: ITag[]): boolean => {
        if (!authorList || !authorList.length || authorList.length === 0) {
          return false;
        }
        return authorList.some((compareAuthor: ITag) => compareAuthor.key === author.key);
      };
    
    const filterSuggestedAuthors = (filterText: string, authorList: ITag[] | undefined): ITag[] => {
        var existingMatches = filterText
        ? authors.filter(
            author => author.name.toLowerCase().indexOf(filterText.toLowerCase()) === 0 && !listContainsAuthorList(author, authorList),
          )
        : [];
    
        if (allowAddNew) {
            return existingMatches.some(a=> a.key === filterText)
            ? existingMatches :
            [{ key: filterText, name: filterText, isNewItem: true } as ITag].concat(existingMatches);
        }
        else {  
            return existingMatches;
        }
    };
    
    const onItemSelected = (item: any | undefined): ITag | PromiseLike<ITag> | null => {
        const selected = selectedAuthors;
        if(item && item.isNewItem) {
            item.isNewItem = false;
            var newAuthors = authors;
            newAuthors.push(item);
            setAuthors(newAuthors);
        }
        return item as ITag;
      };
    
    const onRenderSuggestionsItem = (props: any, itemProps: any): JSX.Element => {
        if (allowAddNew) {
            return <div className={props.isNewItem ? newItem : existingItem} key={props.key}>
          {props.name}
          </div>;
        }
        else {
            return <div className={existingItem} key={props.key}>
          {props.name}
          </div>;
        }
        
      };

    const pickerSuggestionsProps: IBasePickerSuggestionsProps = {
      suggestionsHeaderText: 'Existing Authors',
      noResultsFoundText: allowAddNew ? 'Press Enter to add as a new author' : 'No matching author found',
    };

    async function fetchAuthorsfromCosmos() {
      try {
        const response = await getAllAuthors();
        var newAuthors: ITag[] = [];
        response.authors.forEach((author: string) => {
          const trimmedAuthor = author.trim();
          if (trimmedAuthor !== "" && !newAuthors.some(t => t.key === trimmedAuthor)) {
            const newAuthor: any = { key: trimmedAuthor, name: trimmedAuthor, isNewItem: false };
            newAuthors.push(newAuthor);
          }
        });
        setAuthors(newAuthors);
        if (preSelectedAuthors !== undefined && preSelectedAuthors.length > 0) {
          setSelectedAuthors(preSelectedAuthors);
          onSelectedAuthorsChange(preSelectedAuthors);
        }
        else {
          setSelectedAuthors([]);
          onSelectedAuthorsChange([]);
        }
      }
      catch (error) {
        console.log(error);
      }
    }

    const onChange = (items?: ITag[] | undefined) => {
      if (items) {
        setSelectedAuthors(items);
        onSelectedAuthorsChange(items);
      }
    };

    useEffect(() => {
      fetchAuthorsfromCosmos();
  }, []);
    
    return (
      <div  className={hide? styles.hide : styles.authorArea}>
        <div className={styles.authorSelection}>
          <div className={allowAddNew ? styles.rootClass : styles.rootClassFilter}>
            <label htmlFor={pickerId}><>Authors</> <TooltipHost content={allowAddNew ? "Authors to append to each document uploaded below." : "Authors to filter documents by."}
                    styles={hostStyles}
                    id={tooltipId}>
            <Info16Regular></Info16Regular>
          </TooltipHost></label>
            <TagPicker
                className={styles.authorPicker}
                removeButtonAriaLabel="Remove"
                selectionAriaLabel="Existing authors"
                onResolveSuggestions={filterSuggestedAuthors}
                onRenderSuggestionsItem={onRenderSuggestionsItem}
                getTextFromItem={getTextFromItem}
                pickerSuggestionsProps={pickerSuggestionsProps}
                itemLimit={10}
                // this option tells the picker's callout to render inline instead of in a new layer
                pickerCalloutProps={{ doNotLayer: false }}
                inputProps={{
                    id: pickerId
                }}
                onItemSelected={onItemSelected}
                selectedItems={selectedAuthors}
                onChange={onChange}
            />
          </div>
         
        </div>
      </div>
  );
};
