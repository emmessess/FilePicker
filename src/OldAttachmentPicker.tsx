import * as React from "react";
import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import DocumentPicker from "react-native-document-picker";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { ActionValue, EditableValue } from "mendix";

interface AttachmentPickerProps {
    buttonText?: string;
    buttonBackground?: string;
    fileName?: EditableValue<string>; // Mendix editable property
    onFileSelected?: ActionValue;     // Nanoflow
}

export const AttachmentPicker = (props: AttachmentPickerProps) => {
    const { buttonText = "Select File", buttonBackground = "#007AFF", onFileSelected } = props;
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

 const handlePickFile = useCallback(async () => {
        try {
            const result = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.allFiles] });
             setSelectedFileName(result.name!);

            if (props.fileName && props.fileName.setValue) {
                props.fileName.setValue(result.name!);
            }

            if (onFileSelected && onFileSelected.canExecute) {
                onFileSelected.execute(); // no args
            }
        } catch (err: any) {
            if (!DocumentPicker.isCancel(err)) {
                Alert.alert("Error", err.message);
            }
        }
    }, [props, onFileSelected]);


    return (
        <View style={styles.container}>
            <TouchableOpacity style={[styles.button, { backgroundColor: buttonBackground }]} onPress={handlePickFile}>
                <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>

            {selectedFileName && (
                <View style={styles.fileContainer}>
                    <Text style={styles.fileName}>{selectedFileName}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "column",
        alignItems: "flex-start"
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5
    },
    buttonText: {
        color: "#fff",
        fontSize: 16
    },
    fileContainer: {
        marginTop: 10,
        padding: 8,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        width: "100%"
    },
    fileName: {
        fontSize: 14,
        color: "#333"
    }
});